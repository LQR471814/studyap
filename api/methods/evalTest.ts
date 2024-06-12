import type { DB } from "@/lib/db"
import {
  frqAttempt,
  mcqAttempt,
  testAttempt,
} from "@/lib/schema/schema"
import { eq } from "drizzle-orm"
import type { LLM } from "@/lib/llm/core"
import { evalMCQs } from "./evalMcqs"
import { evalFRQs } from "./evalFrqs"
import type { Span } from "@opentelemetry/api"

export async function evalTest(span: Span | undefined, db: DB, llm: LLM, testId: number) {
  const mcqQuestionIds = await db
    .select({ questionId: mcqAttempt.questionId })
    .from(mcqAttempt)
    .where(eq(mcqAttempt.testId, testId))
  const frqQuestionIds = await db
    .select({ questionId: frqAttempt.questionId })
    .from(frqAttempt)
    .where(eq(frqAttempt.testId, testId))

  await evalMCQs(
    db,
    mcqQuestionIds.map((r) => r.questionId),
  )
  await evalFRQs(
    span,
    db,
    llm,
    frqQuestionIds.map((r) => r.questionId),
  )

  await db
    .update(testAttempt)
    .set({ complete: true })
    .where(eq(testAttempt.id, testId))
}

