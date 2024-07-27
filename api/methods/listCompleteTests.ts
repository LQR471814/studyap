import type { DB } from "@/lib/db"
import {
  frqAttempt,
  mcqAttempt,
  question,
  subject,
  testAttempt,
} from "@/lib/schema/schema"
import { and, eq, sql } from "drizzle-orm"

export async function listCompleteTests(db: DB, userEmail: string) {
  const mcqQuestions = db
    .select()
    .from(question)
    .where(eq(question.format, "mcq"))
    .as("mcqQuestions")

  const frqQuestions = db
    .select()
    .from(question)
    .where(eq(question.format, "frq"))
    .as("frqQuestions")

  return db
    .select({
      id: testAttempt.id,
      createdAt: testAttempt.createdAt,
      subjectName: subject.name,
      subjectId: subject.id,
      scoredMcq: sql<number | null>`sum(${mcqAttempt.scoredPoints})`,
      totalMcq: sql<number | null>`sum(${mcqQuestions.totalPoints})`,
      scoredFrq: sql<number | null>`sum(${frqAttempt.scoredPoints})`,
      totalFrq: sql<number | null>`sum(${frqQuestions.totalPoints})`,
    })
    .from(testAttempt)
    .where(
      and(eq(testAttempt.userEmail, userEmail), eq(testAttempt.complete, true)),
    )
    .innerJoin(subject, eq(testAttempt.subjectId, subject.id))
    .leftJoin(mcqAttempt, eq(mcqAttempt.testId, testAttempt.id))
    .leftJoin(frqAttempt, eq(frqAttempt.testId, testAttempt.id))
    .leftJoin(mcqQuestions, eq(mcqAttempt.questionId, mcqQuestions.id))
    .leftJoin(frqQuestions, eq(frqAttempt.questionId, frqQuestions.id))
    .groupBy(testAttempt.id)
}
