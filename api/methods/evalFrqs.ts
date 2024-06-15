import { formatStimulus } from "@/cmd/generator/llm/synthetic-prompts"
import type { DB } from "@/lib/db"
import type { LLM } from "@/lib/llm/core"
import { frqAttempt, question, stimulus } from "@/lib/schema/schema"
import { retryAsyncFn } from "@/lib/utils"
import type { Span } from "@opentelemetry/api"
import { and, eq, inArray, isNotNull } from "drizzle-orm"
import { z } from "zod"
import { fnSpan } from "../tracer"

export async function evalFRQs(
  span: Span | undefined,
  db: DB,
  llm: LLM,
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
          inArray(frqAttempt.questionId, questionIds),
          isNotNull(frqAttempt.response),
        ),
      )
      .innerJoin(question, eq(question.id, frqAttempt.questionId))
      .innerJoin(stimulus, eq(stimulus.id, question.stimulusId))

    if (span.isRecording()) {
      span.setAttribute("responded", JSON.stringify(responded))
    }

    const grade = retryAsyncFn(
      "grade response",
      3,
      async (
        span: Span | undefined,
        stimulus: string | null,
        question: string,
        totalPoints: number,
        gradingGuidelines: string,
        response: string,
      ) => {
        return fnSpan(span, "grade", async (span) => {
          const gradingResponse = z.object({
            result: z
              .string()
              .describe(
                "An explanation on why the student got the point, do quote phrases and sentences from the student's response.",
              )
              .array()
              .describe(
                `A list grading notes, each note earns the student one point. THIS ARRAY MUST BE NO LONGER THAN ${totalPoints} ELEMENTS.`,
              ),
          })

          const prompt = `# Grade the following response

1. Make sure to call the score_response tool.
2. Make sure to use the grading guidelines.
3. Make sure you do not award more than ${totalPoints} points in the grading response.

## Grading guidelines

${gradingGuidelines}

${
  stimulus
    ? `## Question stimulus / context

${stimulus}`
    : ""
}

## Question

${question}

## Student response

${response}`
          if (span.isRecording()) {
            span.setAttribute("prompt", prompt)
          }

          const res = await llm.generate(span, {
            model: "big",
            systemText:
              "You are a grader employed by the Collegeboard to grade the responses to free response questions in the AP US History exam.",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            mustUseFunctions: true,
            functions: {
              score_response: {
                description: "Score the student's response.",
                returns: gradingResponse,
              },
            },
          })

          const completion = res.returns?.score_response
          if (!completion) {
            throw new Error("empty completion!")
          }

          return completion
        })
      },
    )

    await Promise.all(
      responded.map(async (r) => {
        const scored = await grade(
          span,
          r.stimulus
            ? formatStimulus(r.stimulus, r.imageAltText, r.attribution)
            : null,
          r.question,
          r.totalPoints,
          r.guidelines ?? "",
          r.response ?? "",
        )

        await db
          .update(frqAttempt)
          .set({
            scoredPoints: scored.result.length,
            scoringNotes: scored.result
              .map((s) => `- +1 pt. - ${s}`)
              .join("\n"),
          })
          .where(eq(frqAttempt.questionId, r.questionId))
      }),
    )
  })
}
