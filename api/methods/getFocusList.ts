import type { DB } from "@/lib/db"
import {
  frqAttempt,
  mcqAttempt,
  subject,
  testAttempt,
} from "@/lib/schema/schema"
import { and, eq, inArray } from "drizzle-orm"
import { evalMCQs } from "./evalMcqs"

type QuestionStats = {
  totalScored: number
  totalPoints: number
}

export type Unit = {
  id: number
  name: string

  mcq: QuestionStats
  frq: QuestionStats
  overallPercent: number
  practiced: boolean
}

export type Subject = {
  id: number
  name: string

  units: Unit[]
  averageUnitPercent: number
  progressPercent: number
}

function incompleteUnit({ mcq, frq }: Unit): boolean {
  return mcq.totalPoints === 0 && frq.totalPoints === 0
}

/**
 * Computes the unit percentage.
 */
function unitPercent(mcq: QuestionStats, frq: QuestionStats): number {
  const percentageMcq = mcq.totalScored / mcq.totalPoints
  const percentageFrq = frq.totalScored / frq.totalPoints
  if (!Number.isFinite(percentageMcq) && !Number.isFinite(percentageFrq)) {
    return 0
  }
  if (!Number.isFinite(percentageMcq)) {
    return percentageFrq
  }
  if (!Number.isFinite(percentageFrq)) {
    return percentageMcq
  }
  return (percentageMcq + percentageFrq) / 2
}

async function ensureAllTestsUpToDate(db: DB, userEmail: string) {
  const tests = await db
    .select({
      id: testAttempt.id,
      mcqUpToDate: testAttempt.mcqEvalUpToDate,
    })
    .from(testAttempt)
    .where(
      and(eq(testAttempt.userEmail, userEmail), eq(testAttempt.complete, true)),
    )

  await Promise.all(
    tests.map(async (t) => {
      if (t.mcqUpToDate) {
        return
      }
      const questionIds = (
        await db
          .select({ questionId: mcqAttempt.questionId })
          .from(mcqAttempt)
          .where(eq(mcqAttempt.testId, t.id))
      ).map((q) => q.questionId)
      await evalMCQs(db, t.id, questionIds)
    }),
  )
}

/**
 * Focus list algorithm goes something like:
 * 1. Find all the subjects you've taken.
 * 2. For each subject, get a list of units.
 * 3. For each unit, get a list of mcqs, find total scored points out of total total points.
 * 4. For each unit, get a list of frqs, find total scored points out of total total poitns.
 * 5. Sort units by average between the mcqs score percentage and the frqs score percentage, unpracticed units go first.
 * 6. Sort subjects by the average percentage score of practiced units, then multiplied by the percentage of units practiced.
 */
export async function getFocusList(db: DB, userEmail: string) {
  await ensureAllTestsUpToDate(db, userEmail)

  const testIds = (
    await db
      .select({ id: testAttempt.id })
      .from(testAttempt)
      .where(
        and(
          eq(testAttempt.userEmail, userEmail),
          eq(testAttempt.complete, true),
        ),
      )
  ).map((r) => r.id)
  if (testIds.length === 0) {
    return []
  }

  const subjectIds = await db
    .selectDistinct({ subjectId: testAttempt.subjectId })
    .from(testAttempt)
    .where(eq(testAttempt.userEmail, userEmail))

  const subjects = await db.query.subject.findMany({
    columns: {
      id: true,
      name: true,
    },
    with: {
      unit: {
        columns: {
          id: true,
          name: true,
        },
        with: {
          questionUnit: {
            columns: {},
            with: {
              question: {
                columns: {
                  totalPoints: true,
                },
                with: {
                  mcqAttempt: {
                    columns: {
                      scoredPoints: true,
                    },
                    where: inArray(mcqAttempt.testId, testIds),
                  },
                  frqAttempt: {
                    columns: {
                      scoredPoints: true,
                    },
                    where: inArray(frqAttempt.testId, testIds),
                  },
                },
              },
            },
          },
        },
      },
    },
    where: inArray(
      subject.id,
      subjectIds.map((r) => r.subjectId),
    ),
  })

  const resultSubjects: Subject[] = []
  for (const subj of subjects) {
    const resultUnits: Unit[] = []

    for (const unit of subj.unit) {
      let totalMcqScored = 0
      let totalMcqPoints = 0

      let totalFrqScored = 0
      let totalFrqPoints = 0

      for (const quesUnit of unit.questionUnit) {
        for (const mcq of quesUnit.question.mcqAttempt) {
          if (mcq.scoredPoints !== null) {
            totalMcqScored += mcq.scoredPoints
          }
          totalMcqPoints += quesUnit.question.totalPoints
        }
        for (const frq of quesUnit.question.frqAttempt) {
          if (frq.scoredPoints !== null) {
            totalFrqScored += frq.scoredPoints
          }
          totalFrqPoints += quesUnit.question.totalPoints
        }
      }

      const mcqStat: QuestionStats = {
        totalScored: totalMcqScored,
        totalPoints: totalMcqPoints,
      }
      const frqStat: QuestionStats = {
        totalScored: totalFrqScored,
        totalPoints: totalFrqPoints,
      }

      resultUnits.push({
        id: unit.id,
        name: unit.name,
        mcq: mcqStat,
        frq: frqStat,
        overallPercent: unitPercent(mcqStat, frqStat),
        practiced: mcqStat.totalPoints > 0 || frqStat.totalPoints > 0,
      })
    }

    resultUnits.sort((a, b) => {
      const aIncomplete = incompleteUnit(a)
      const bIncomplete = incompleteUnit(b)

      if (aIncomplete && bIncomplete) {
        return 0
      }
      if (aIncomplete) {
        return -1
      }
      if (bIncomplete) {
        return 1
      }

      if (a.overallPercent < b.overallPercent) {
        return -1
      }
      if (b.overallPercent < a.overallPercent) {
        return 1
      }
      return 0
    })

    let unitPercentSum = 0
    let completeCount = 0
    for (const u of resultUnits) {
      if (incompleteUnit(u)) {
        continue
      }
      unitPercentSum += u.overallPercent
      completeCount++
    }
    const avgUnitPercent = unitPercentSum / completeCount

    resultSubjects.push({
      id: subj.id,
      name: subj.name,
      units: resultUnits,
      averageUnitPercent: avgUnitPercent,
      progressPercent: completeCount / resultUnits.length,
    })
  }

  resultSubjects.sort((a, b) => {
    const aScore = a.progressPercent * a.averageUnitPercent
    const bScore = b.progressPercent * b.averageUnitPercent

    if (aScore < bScore) {
      return -1
    }
    if (aScore > bScore) {
      return 1
    }
    return 0
  })

  return resultSubjects
}
