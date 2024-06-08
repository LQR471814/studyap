import {
  frqAttempt,
  mcqAttempt,
  question,
  subject,
  testAttempt,
} from "@/lib/schema/schema"
import { and, eq, sql } from "drizzle-orm"
import type { DB } from "@/lib/db"

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
      scoredMcq: sql<number>`sum(${mcqAttempt.scoredPoints})`,
      totalMcq: sql<number>`sum(${mcqQuestions.totalPoints})`,
      scoredFrq: sql<number>`sum(${frqAttempt.scoredPoints})`,
      totalFrq: sql<number>`sum(${frqQuestions.totalPoints})`,
    })
    .from(testAttempt)
    .where(
      and(eq(testAttempt.userEmail, userEmail), eq(testAttempt.complete, true)),
    )
    .innerJoin(subject, eq(testAttempt.subjectId, subject.id))
    .innerJoin(mcqAttempt, eq(mcqAttempt.testId, testAttempt.id))
    .innerJoin(frqAttempt, eq(frqAttempt.testId, testAttempt.id))
    .innerJoin(mcqQuestions, eq(mcqAttempt.questionId, mcqQuestions.id))
    .innerJoin(frqQuestions, eq(frqAttempt.questionId, frqQuestions.id))
    .groupBy(testAttempt.id)
}
