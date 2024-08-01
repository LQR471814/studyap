import type { DB } from "@/lib/db"
import { formatStimulus } from "@/lib/llm-test-generator/synthetic-prompts"
import type { LLM } from "@/lib/llm/core"
import { frqAttempt, question, stimulus } from "@/lib/schema/schema"
import type { Span } from "@opentelemetry/api"
import { and, eq, inArray, isNotNull } from "drizzle-orm"
import { fnSpan } from "../tracer"
import { grade } from "./evalSingleFrq"

export async function evalFRQs(
  span: Span | undefined,
  db: DB,
  llm: LLM,
  testId: number,
  questionIds: number[],
) {
  if (questionIds.length === 0) {
    return
  }

  return fnSpan(span, "evalFRQs", async (span) => {
    if (span.isRecording()) {
      span.setAttribute("questionIds", JSON.stringify(questionIds))
    }

    const responded = await db
      .select({
        questionId: frqAttempt.questionId,
        testId: frqAttempt.testId,
        response: frqAttempt.response,
        question: question.content,
        totalPoints: question.totalPoints,
        guidelines: question.gradingGuidelines,
        stimulus: stimulus.content,
        attribution: stimulus.attribution,
        imageAltText: stimulus.imageAltText,
      })
      .from(frqAttempt)
      .where(
        and(
          eq(frqAttempt.testId, testId),
          inArray(frqAttempt.questionId, questionIds),
          isNotNull(frqAttempt.response),
        ),
      )
      .innerJoin(question, eq(question.id, frqAttempt.questionId))
      .innerJoin(stimulus, eq(stimulus.id, question.stimulusId))

    if (span.isRecording()) {
      span.setAttribute("responded", JSON.stringify(responded))
    }

    await db.transaction(async (tx) => {
      await Promise.all(
        responded.map(async (r) => {
          const scored = await grade(span, llm, {
            stimulus: r.stimulus
              ? formatStimulus(r.stimulus, r.imageAltText, r.attribution)
              : null,
            question: r.question,
            totalPoints: r.totalPoints,
            gradingGuidelines: r.guidelines ?? "",
            response: r.response ?? "",
          })

          await tx
            .update(frqAttempt)
            .set({
              scoredPoints: scored.result.length,
              scoringNotes: scored.result
                .map((s) => `- +1 pt. - ${s}`)
                .join("\n"),
            })
            .where(
              and(
                eq(frqAttempt.testId, testId),
                eq(frqAttempt.questionId, r.questionId),
              ),
            )
        }),
      )
    })
  })
}
