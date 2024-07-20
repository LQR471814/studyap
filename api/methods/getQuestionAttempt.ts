import type { DB } from "@/lib/db"
import { frqAttempt, mcqAttempt } from "@/lib/schema/schema"
import { and, eq } from "drizzle-orm"

export async function getQuestionAttempt(
  db: DB,
  testAttemptId: number,
  questionNumber: number,
) {
  const mcq = await db.query.mcqAttempt.findFirst({
    with: {
      question: {
        with: {
          questionChoice: true,
        },
      },
    },
    where: and(
      eq(mcqAttempt.testId, testAttemptId),
      eq(mcqAttempt.questionNumber, questionNumber),
    ),
  })
  const frq = await db.query.frqAttempt.findFirst({
    with: {
      question: true,
    },
    where: and(
      eq(frqAttempt.testId, testAttemptId),
      eq(frqAttempt.questionNumber, questionNumber),
    ),
  })
  if (frq) {
    return { frq }
  }
  if (mcq) {
    return { mcq }
  }
}
