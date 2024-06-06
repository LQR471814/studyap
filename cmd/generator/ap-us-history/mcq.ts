import { z } from "zod"
import { STIMULI } from "./stimuli"
import { UNITS } from "./units"
import zodToJsonSchema from "zod-to-json-schema"
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { retryAsyncFn } from "@/lib/utils"
import { question, questionChoice, questionUnit } from "@/lib/schema/schema"
import { SUBJECT } from "./subject"
import { ctx } from "../context"

const { openaiQueue, openai, db } = ctx

const questionObj = z.object({
  question: z
    .string()
    .describe(
      "The plain text question content of the multiple choice question.",
    ),
  choices: z
    .object({
      text: z
        .string()
        .describe(
          "A plain text potential answer pertaining to the multiple choice question.",
        ),
      correct: z
        .boolean()
        .describe(
          "A boolean that is true if this answer choice is the correct or one of the correct answer choices.",
        ),
      explanation: z
        .string()
        .describe(
          "An explanation explaining why this answer is correct or incorrect as indicated by the 'correct' field.",
        ),
    })
    .array()
    .describe("A list of potential answer for the multiple choice question."),
})
const questionJsonSchema = zodToJsonSchema(questionObj)

function generateQuestion(
  unit: string,
  stimulus: string,
  twoPossibleAnswers: boolean,
): AsyncIterable<z.TypeOf<typeof questionObj>> {
  const possibleAnswerSuffix = twoPossibleAnswers
    ? " Make sure each question you create has exactly 2 possible answers."
    : ""
  const stimulusSuffix = `\nStimulus:\n${stimulus}`

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are a high school history teacher employed by the collegeboard to create multiple choice questions for the AP US History exam.",
    },
    {
      role: "user",
      content: `Create a multiple choice question for the following stimulus pertaining to the unit '${unit}', make sure to call the generate_mcq function.${possibleAnswerSuffix}${stimulusSuffix}`,
    },
  ]

  const askOpenai = retryAsyncFn("generate mcq", 5, async () => {
    const res = await openaiQueue.add(() => {
      return openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        functions: [
          {
            name: "generate_mcq",
            description:
              "Create a multiple choice question for the AP US History exam.",
            parameters: questionJsonSchema,
          },
        ],
      })
    })
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
              content: `Great! Now generate another one still pertaining to the unit '${unit}' and the aforementioned stimulus.${possibleAnswerSuffix}`,
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
        `${stimulus.imageAltText
          ? "This is an image with the following description: "
          : ""
        }${stimulus.imageAltText}\n- ${stimulus.attribution}`,
        false,
      )

      let len = 0
      for await (const value of generator) {
        if (len >= 3) {
          break
        }
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

export const MCQs = generatedQuestions

const questionIds = (
  await db
    .insert(question)
    .values(
      generatedQuestions.map((q) => ({
        stimulusId: q.stimulusId,
        format: "mcq" as const,
        content: q.value.question,
        totalPoints: 1,
        subjectId: SUBJECT.id,
      })),
    )
    .returning({ id: question.id })
).map((row, idx) => ({
  id: row.id,
  unitId: generatedQuestions[idx].unitId,
  choices: generatedQuestions[idx].value.choices,
}))

await db.insert(questionUnit).values(
  questionIds.map((q) => ({
    unitId: q.unitId,
    questionId: q.id,
  })),
)

await db.insert(questionChoice).values(
  questionIds.flatMap((q) =>
    q.choices.map((c) => ({
      questionId: q.id,
      choice: c.text,
      correct: c.correct,
      explanation: c.explanation,
    })),
  ),
)
