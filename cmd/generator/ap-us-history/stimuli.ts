import type { Message } from "@/lib/llm/core"
import { stimulus } from "@/lib/schema/schema"
import { memo, retryAsyncFn } from "@/lib/utils"
import { z } from "zod"
import type { Context } from "../context"
import { generateSubject } from "./subject"
import { generateUnits } from "./units"

export const generateStimuli = memo(async (ctx: Context) => {
  const stimulusObj = z.object({
    text: z
      .string()
      .describe(
        "The plain text content of the stimulus, this can be an excerpt from a historical document, a written treaty, or any other historical text. THIS SHOULD NOT BE A SUMMARY. The text that you quote should be relatively long, at least 5 sentences. You also have the option to describe a photograph or political cartoon in this field, if you do, set the 'image' field to TRUE.",
      ),
    attribution: z
      .string()
      .describe("The author, organization, or source this text comes from."),
    image: z
      .boolean()
      .describe(
        "This should be set to TRUE if the 'text' field describes an image.",
      ),
  })

  function stimulusIterable(
    unit: string,
    format: "multiple choice" | "free response",
  ): AsyncIterable<z.TypeOf<typeof stimulusObj>> {
    const messages: Message[] = [
      {
        role: "user",
        content: `For this stimulus, create it for a ${format} question pertaining to the unit '${unit}', make sure to call the generate_stimulus function.`,
      },
    ]

    const askOpenai = retryAsyncFn("generate stimulus", 5, async () => {
      const res = await ctx.llmQueue.add(() =>
        ctx.llm.generate({
          model: "big",
          systemText:
            "You are a high school history teacher employed by the collegeboard to create stimuli for questions on the AP US History exam.",
          messages,
          functions: {
            generate_stimulus: {
              description: "Create a stimulus for the AP US History exam.",
              returns: stimulusObj,
            },
          },
        }),
      )
      const completion = res ? res.returns?.generate_stimulus : undefined
      if (!completion) {
        throw new Error("empty completion!")
      }
      return completion
    })

    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            if (messages.length > 2) {
              messages.push({
                role: "user",
                content: `Great! Now generate another one from a different source, still pertaining to the unit '${unit}'.`,
              })
            }
            const result = await askOpenai()
            return { value: result }
          },
        }
      },
    }
  }

  const SUBJECT = await generateSubject(ctx)
  const UNITS = await generateUnits(ctx)

  const generatedStimuli: {
    value: z.TypeOf<typeof stimulusObj>
    unitId: number
    format: "mcq" | "frq"
  }[] = []

  await Promise.all(
    UNITS.map(async (unit) => {
      let generator = stimulusIterable(unit.name, "multiple choice")
      let len = 0
      for await (const value of generator) {
        if (len >= 3) {
          break
        }
        console.log(value)
        generatedStimuli.push({ value, format: "mcq", unitId: unit.id })
        len++
      }

      generator = stimulusIterable(unit.name, "free response")
      len = 0
      for await (const value of generator) {
        if (len >= 3) {
          break
        }
        console.log(value)
        generatedStimuli.push({ value, format: "frq", unitId: unit.id })
        len++
      }
    }),
  )

  const STIMULI = await ctx.db
    .insert(stimulus)
    .values(
      generatedStimuli.map((s) => ({
        content: s.value.text,
        attribution: s.value.attribution,
        forFormat: s.format,
        subjectId: SUBJECT.id,
      })),
    )
    .returning()

  return STIMULI
})
