import { z } from "zod"
import { STIMULI } from "./stimuli"
import { UNITS } from "./units"
import zodToJsonSchema from "zod-to-json-schema"
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { retryAsyncFn } from "@/lib/utils"
import {
  question,
  questionGradingGuidelines,
  questionUnit,
} from "@/lib/schema/schema"
import { SUBJECT } from "./subject"
import { ctx } from "../context"

const { openaiQueue, openai, db } = ctx

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
const questionJsonSchema = zodToJsonSchema(questionObj)

function generateQuestion(
  unit: string,
  stimulus: string,
): AsyncIterable<z.TypeOf<typeof questionObj>> {
  const stimulusSuffix = `\nStimulus:\n${stimulus}`

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a high school history teacher employed by the collegeboard to create free response questions for the AP US History exam.",
    },
    {
      role: "user",
      content: `Create a free response question for the following stimulus pertaining to the unit '${unit}', make sure to call the generate_frq function.${stimulusSuffix}`,
    },
  ]

  const askOpenai = retryAsyncFn("generate frq", 5, async () => {
    const res = await openaiQueue.add(() =>
      openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        functions: [
          {
            name: "generate_frq",
            description:
              "Create a free response question for the AP US History exam.",
            parameters: questionJsonSchema,
          },
        ],
      }),
    )
    const completion = res?.choices[0].message.function_call?.arguments
    if (!completion) {
      throw new Error("empty completion!")
    }
    messages.push({
      role: "assistant",
      content: completion,
    })
    return questionObj.parse(JSON.parse(completion))
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
          const result = await askOpenai()
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
        `${
          stimulus.imageAltText
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

export const FRQs = generatedQuestions

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
