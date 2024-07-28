import type { DB } from "@/lib/db"
import {
  stimulus,
  question,
  frqAttempt,
  mcqAttempt,
  testAttempt,
  subject,
} from "@/lib/schema/schema"
import { and, eq, isNotNull, sql } from "drizzle-orm"

export type SubjectStats = {
  id: number
  name: string

  completedQuestions: number
  totalQuestions: number
}

export async function getSubjectProgressChart(
  db: DB,
  userEmail: string,
): Promise<SubjectStats[]> {
  const userSubjects = db
    .selectDistinct({
      subjectId: testAttempt.subjectId,
      subjectName: subject.name,
    })
    .from(testAttempt)
    .where(
      and(eq(testAttempt.userEmail, userEmail), eq(testAttempt.complete, true)),
    )
    .innerJoin(subject, eq(testAttempt.subjectId, subject.id))
    .as("userSubjects")

  const stats: SubjectStats[] = []

  const totalSubjectQuestions = await db
    .select({
      subjectId: userSubjects.subjectId,
      subjectName: userSubjects.subjectName,
      questionCount: sql<number>`count(distinct ${question.id})`,
    })
    .from(userSubjects)
    .leftJoin(stimulus, eq(stimulus.subjectId, userSubjects.subjectId))
    .leftJoin(question, eq(question.stimulusId, stimulus.id))
    .groupBy(userSubjects.subjectId)

  for (const q of totalSubjectQuestions) {
    const mcqRows = await db
      .select({
        mcqQuestionCount: sql<number>`count(distinct ${mcqAttempt.questionId})`,
      })
      .from(testAttempt)
      .leftJoin(mcqAttempt, eq(mcqAttempt.testId, testAttempt.id))
      .where(
        and(
          eq(testAttempt.subjectId, q.subjectId),
          eq(testAttempt.userEmail, userEmail),
          isNotNull(mcqAttempt.scoredPoints),
        ),
      )
      .groupBy(testAttempt.id)

    const frqRows = await db
      .select({
        frqQuestionCount: sql<number>`count(distinct ${frqAttempt.questionId})`,
      })
      .from(testAttempt)
      .leftJoin(frqAttempt, eq(frqAttempt.testId, testAttempt.id))
      .where(
        and(
          eq(testAttempt.subjectId, q.subjectId),
          eq(testAttempt.userEmail, userEmail),
          isNotNull(frqAttempt.scoredPoints),
        ),
      )
      .groupBy(testAttempt.id)

    const mcqQuestionCount = mcqRows[0]?.mcqQuestionCount ?? 0
    const frqQuestionCount = frqRows[0]?.frqQuestionCount ?? 0

    stats.push({
      id: q.subjectId,
      name: q.subjectName,
      completedQuestions: mcqQuestionCount + frqQuestionCount,
      totalQuestions: q.questionCount,
    })
  }

  return stats
}
