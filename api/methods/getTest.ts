import type { DB } from "@/lib/db"
import { testAttempt, testStimulus } from "@/lib/schema/schema"
import { and, eq } from "drizzle-orm"

export async function getTest(
  db: DB,
  userEmail: string,
  testAttemptId: number,
) {
  const test = await db.query.testAttempt.findFirst({
    with: {
      subject: true,
      testStimulus: {
        with: {
          stimulus: true,
          mcqAttempt: {
            with: {
              question: {
                with: {
                  questionChoice: true,
                },
              },
            },
          },
          frqAttempt: {
            with: {
              question: true,
            },
          },
        },
        orderBy: [testStimulus.groupNumber],
      },
    },
    where: and(
      eq(testAttempt.id, testAttemptId),
      eq(testAttempt.userEmail, userEmail),
    ),
  })
  if (!test) {
    throw new Error(`could not find test with id '${testAttemptId}'`)
  }
  return test
}
