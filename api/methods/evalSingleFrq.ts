import type { DB } from "@/lib/db"
import type { LLM } from "@/lib/llm/core"
import { frqAttempt, question, stimulus } from "@/lib/schema/schema"
import { retryAsyncFn } from "@/lib/utils"
import type { Span } from "@opentelemetry/api"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { fnSpan } from "../tracer"

export type Frq = {
  stimulus: string | null
  question: string
  totalPoints: number
  gradingGuidelines: string
  response: string
}

export async function grade(span: Span | undefined, llm: LLM, frq: Frq) {
  return fnSpan(span, "grade", async (span) => {
    const retryGrade = retryAsyncFn("evalSingleFRQ", 3, async () => {
      // return {
      //   result: ["this is correct", "this is correct #2", "this is correct #3"]
      // }

      const { stimulus, question, totalPoints, gradingGuidelines, response } =
        frq

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

    const gradeResult = await Promise.race<
      | {
          result: string[]
        }
      | undefined
    >([retryGrade(), new Promise((r) => setTimeout(r, 1000 * 15))])

    if (!gradeResult) {
      throw new Error("Grade attempt timed out.")
    }

    return gradeResult
  })
}

export async function evalSingleFRQ(
  span: Span | undefined,
  db: DB,
  llm: LLM,
  testId: number,
  questionId: number,
) {
  const [row] = await db
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
      and(eq(frqAttempt.testId, testId), eq(frqAttempt.questionId, questionId)),
    )
    .innerJoin(question, eq(question.id, frqAttempt.questionId))
    .innerJoin(stimulus, eq(stimulus.id, question.stimulusId))
  if (!row) {
    throw new Error("unknown row")
  }

  const scored = await grade(span, llm, {
    totalPoints: row.totalPoints,
    response: row.response ?? "",
    question: row.question,
    stimulus: row.stimulus,
    gradingGuidelines: row.guidelines ?? "",
  })

  await db
    .update(frqAttempt)
    .set({
      scoredPoints: scored.result.length,
      scoringNotes: scored.result.map((s) => `- +1 pt. - ${s}`).join("\n"),
    })
    .where(
      and(eq(frqAttempt.testId, testId), eq(frqAttempt.questionId, questionId)),
    )
}
