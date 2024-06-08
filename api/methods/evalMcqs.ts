import type { DB } from "@/lib/db"
import { mcqAttempt, questionChoice } from "@/lib/schema/schema"
import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm"

export async function evalMCQs(db: DB, questionIds: number[]) {
  const responded = () =>
    db
      .select({
        questionId: mcqAttempt.questionId,
        testId: mcqAttempt.testId,
      })
      .from(mcqAttempt)
      .where(
        and(
          inArray(mcqAttempt.questionId, questionIds),
          isNull(mcqAttempt.scoredPoints),
          isNotNull(mcqAttempt.response),
        ),
      )

  // mcqAttempts that ended up correct
  const correctAttempts = await responded().innerJoin(
    questionChoice,
    and(
      eq(questionChoice.id, mcqAttempt.response),
      eq(questionChoice.correct, true),
    ),
  )

  await db
    .update(mcqAttempt)
    .set({ scoredPoints: 1 })
    .where(
      or(
        ...correctAttempts.map((a) =>
          and(
            eq(mcqAttempt.questionId, a.questionId),
            eq(mcqAttempt.testId, a.testId),
          ),
        ),
      ),
    )

  // mcqAttempts that ended up incorrect
  const incorrectAttempts = await responded().innerJoin(
    questionChoice,
    and(
      eq(questionChoice.id, mcqAttempt.response),
      eq(questionChoice.correct, false),
    ),
  )

  await db
    .update(mcqAttempt)
    .set({ scoredPoints: 0 })
    .where(
      or(
        ...incorrectAttempts.map((a) =>
          and(
            eq(mcqAttempt.questionId, a.questionId),
            eq(mcqAttempt.testId, a.testId),
          ),
        ),
      ),
    )
}

