import type { DB } from "@/lib/db"
import {
  frqAttempt,
  mcqAttempt,
  question,
  questionUnit,
  testAttempt,
} from "@/lib/schema/schema"
import { and, eq, inArray, isNull, sql } from "drizzle-orm"

export async function getAvailableQuestionCount(
  userEmail: string,
  db: DB,
  subjectId: number,
  units?: number[],
) {
  // gets all the mcqIds which already have a corresponding mcqAttempt for userEmail
  const hasMcqAttemptByUser = db
    .select({ questionId: mcqAttempt.questionId })
    .from(mcqAttempt)
    .innerJoin(testAttempt, eq(testAttempt.id, mcqAttempt.testId))
    .where(eq(testAttempt.userEmail, userEmail))
    .as("hasMcqAttemptByUser")

  // gets all the mcqs that are not joined with hasMcqAttempt,
  // that is, all the mcqs that aren't attempted by this user yet
  const mcqs = await db
    .select({
      count: sql<number>`count(distinct ${question.id})`.mapWith(Number),
    })
    .from(question)
    .leftJoin(
      hasMcqAttemptByUser,
      eq(question.id, hasMcqAttemptByUser.questionId),
    )
    .innerJoin(questionUnit, eq(questionUnit.questionId, question.id))
    .where(
      and(
        isNull(hasMcqAttemptByUser.questionId),
        eq(question.subjectId, subjectId),
        eq(question.format, "mcq"),
        units && units.length > 0
          ? inArray(questionUnit.unitId, units)
          : undefined,
      ),
    )

  const hasFrqAttemptByUser = db
    .select({ questionId: frqAttempt.questionId })
    .from(frqAttempt)
    .innerJoin(testAttempt, eq(testAttempt.id, frqAttempt.testId))
    .where(eq(testAttempt.userEmail, userEmail))
    .as("hasFrqAttemptByUser")

  const frqs = await db
    .select({
      count: sql<number>`count(distinct ${question.id})`.mapWith(Number),
    })
    .from(question)
    .leftJoin(
      hasFrqAttemptByUser,
      eq(question.id, hasFrqAttemptByUser.questionId),
    )
    .innerJoin(questionUnit, eq(questionUnit.questionId, question.id))
    .where(
      and(
        isNull(hasFrqAttemptByUser.questionId),
        eq(question.subjectId, subjectId),
        eq(question.format, "frq"),
        units && units.length > 0
          ? inArray(questionUnit.unitId, units)
          : undefined,
      ),
    )

  return { frqs: frqs[0].count, mcqs: mcqs[0].count }
}
