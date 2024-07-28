import type { DB } from "@/lib/db"
import {
  frqAttempt,
  mcqAttempt,
  unit,
  questionUnit,
  stimulusUnit,
  testAttempt,
  subject,
} from "@/lib/schema/schema"
import { and, eq, isNotNull, sql } from "drizzle-orm"

export type UnitStats = {
  id: number
  name: string

  completedQuestions: number
  totalQuestions: number
}

export async function getUnitProgressChart(
  db: DB,
  userEmail: string,
  subjectId: number,
): Promise<{ stats: UnitStats[]; subjectName: string }> {
  const [{ subjectName }] = await db
    .select({ subjectName: subject.name })
    .from(subject)
    .where(eq(subject.id, subjectId))

  const totalUnitCount = await db
    .select({
      unitId: unit.id,
      unitName: unit.name,
      totalQuestionCount: sql<number>`count(distinct ${questionUnit.questionId})`,
    })
    .from(unit)
    .where(eq(unit.subjectId, subjectId))
    .innerJoin(questionUnit, eq(questionUnit.unitId, unit.id))
    .groupBy(unit.id)

  const stats: UnitStats[] = []

  const mcqCountList = await db
    .select({
      unitId: stimulusUnit.unitId,
      completedMcqs: sql<number>`count(distinct ${mcqAttempt.questionId})`,
    })
    .from(testAttempt)
    .innerJoin(mcqAttempt, eq(mcqAttempt.testId, testAttempt.id))
    .where(
      and(isNotNull(mcqAttempt.response), eq(testAttempt.userEmail, userEmail)),
    )
    .innerJoin(stimulusUnit, eq(stimulusUnit.stimulusId, mcqAttempt.stimulusId))
    .groupBy(stimulusUnit.unitId)

  const frqCountList = await db
    .select({
      unitId: stimulusUnit.unitId,
      completedFrqs: sql<number>`count(distinct ${frqAttempt.questionId})`,
    })
    .from(testAttempt)
    .innerJoin(frqAttempt, eq(frqAttempt.testId, testAttempt.id))
    .where(
      and(isNotNull(frqAttempt.response), eq(testAttempt.userEmail, userEmail)),
    )
    .innerJoin(stimulusUnit, eq(stimulusUnit.stimulusId, frqAttempt.stimulusId))
    .groupBy(stimulusUnit.unitId)

  for (const unitRow of totalUnitCount) {
    const mcq = mcqCountList.find((c) => c.unitId === unitRow.unitId)
    const frq = frqCountList.find((c) => c.unitId === unitRow.unitId)

    stats.push({
      id: unitRow.unitId,
      name: unitRow.unitName,
      completedQuestions: (mcq?.completedMcqs ?? 0) + (frq?.completedFrqs ?? 0),
      totalQuestions: unitRow.totalQuestionCount,
    })
  }

  return { subjectName, stats }
}
