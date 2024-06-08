import {
  question,
  questionGradingGuidelines,
  questionUnit,
} from "@/lib/schema/schema"
import { memo, retryAsyncFn } from "@/lib/utils"
import { z } from "zod"
import { generateStimuli } from "./stimuli"
import { generateSubject } from "./subject"
import { generateUnits } from "./units"
import type { Context } from "../context"
import type { Message } from "@/lib/llm/core"

export const generateFrqs = memo(async (ctx: Context) => {
  const { llmQueue, llm, db } = ctx

  const SUBJECT = await generateSubject(ctx)
  const UNITS = await generateUnits(ctx)
  const STIMULI = await generateStimuli(ctx)

  const questionObj = z.object({
    question: z
      .string()
      .describe("The plain text question content of the free response question."),
    guidelines: z
      .string()
      .describe(
        `Grading guidelines to be given to a grader on how they should score an arbitrary student response to the question.
Example.
- 1 pt for mentioning the presidential precedents set by George Washington.
- 1 pt for mentioning WWII
etc...`,
      ),
    totalPoints: z
      .number()
      .describe(
        "The total amount of points a student can earn on this question.",
      ),
  })

  function generateQuestion(
    unit: string,
    stimulus: string,
  ): AsyncIterable<z.TypeOf<typeof questionObj>> {
    const stimulusSuffix = `\nStimulus:\n${stimulus}`

    const messages: Message[] = [
      {
        role: "user",
        content: `Create a free response question for the following stimulus pertaining to the unit '${unit}', make sure to call the generate_frq function.${stimulusSuffix}`,
      },
    ]

    const askLLM = retryAsyncFn("generate frq", 5, async () => {
      const res = await llmQueue.add(() =>
        llm.generate({
          model: "big",
          messages: messages,
          systemText: "You are a high school history teacher employed by the collegeboard to create free response questions for the AP US History exam.",
          functions: {
            generate_frq: {
              description:
                "Create a free response question for the AP US History exam.",
              returns: questionObj,
            }
          },
        }),
      )
      if (!res) {
        throw new Error("empty completion!")
      }
      const completion = res.returns?.generate_frq
      if (!completion) {
        throw new Error("empty completion!")
      }
      messages.push({
        role: "assistant",
        content: res.text,
      })
      return completion
    })

    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            if (messages.length > 2) {
              messages.push({
                role: "user",
                content: `Great! Now generate another one still pertaining to the unit '${unit}' and the aforementioned stimulus.`,
              })
            }
            const result = await askLLM()
            return { value: result }
          },
        }
      },
    }
  }

  const generatedQuestions: {
    value: z.TypeOf<typeof questionObj>
    unitId: number
    stimulusId: number
  }[] = []

  await Promise.all(
    UNITS.flatMap((unit) =>
      STIMULI.map(async (stimulus) => {
        const generator = generateQuestion(
          unit.name,
          `${stimulus.imageAltText
            ? "This is an image with the following description: "
            : ""
          }${stimulus.imageAltText}\n- ${stimulus.attribution}`,
        )

        let len = 0
        for await (const value of generator) {
          if (len >= 3) {
            break
          }
          console.log(unit, stimulus, value)
          generatedQuestions.push({
            value,
            unitId: unit.id,
            stimulusId: stimulus.id,
          })
          len++
        }
      }),
    ),
  )

  const questionIds = (
    await db
      .insert(question)
      .values(
        generatedQuestions.map((q) => ({
          stimulusId: q.stimulusId,
          format: "frq" as const,
          content: q.value.question,
          totalPoints: 1,
          subjectId: SUBJECT.id,
        })),
      )
      .returning({ id: question.id })
  ).map((row, idx) => ({
    id: row.id,
    unitId: generatedQuestions[idx].unitId,
    guidelines: generatedQuestions[idx].value.guidelines,
  }))

  await db.insert(questionUnit).values(
    questionIds.map((q) => ({
      unitId: q.unitId,
      questionId: q.id,
    })),
  )

  await db.insert(questionGradingGuidelines).values(
    questionIds.map((q) => ({
      questionId: q.id,
      content: q.guidelines,
    })),
  )

  return generatedQuestions
})

