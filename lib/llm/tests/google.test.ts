import { initializeOtelVitest } from "@/lib/telemetry/vitest"
import type { Span } from "@opentelemetry/api"
import { describe, expect, test } from "vitest"
import { z } from "zod"
import { Gemini } from "../google"
import { fnSpan } from "./singletons"

initializeOtelVitest("test:llm-google")

describe("generate", () => {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.warn("GOOGLE_API_KEY must be defined in order to run this test.")
    test("all tests skipped")
    return
  }
  const llm = new Gemini(apiKey)

  // test("root is number", () =>
  //   fnSpan(undefined, "root is number", async (span) => {
  //     const def = z.number().describe("generate a number from 1 to 10.")
  //     const res = await llm.generate(span, {
  //       model: "small",
  //       messages: [
  //         {
  //           role: "user",
  //           content: "Generate a number, then return it to the user.",
  //         },
  //       ],
  //       mustUseFunctions: true,
  //       functions: {
  //         result: {
  //           description: "Outputs the generated result to the user.",
  //           returns: def,
  //         },
  //       },
  //     })
  //     expect(res.returns?.result).toBeDefined()
  //   }))

  test("root is array", () =>
    fnSpan(undefined, "root is array", async (span: Span) => {
      const def = z
        .object({
          name: z.string().describe("an english name"),
          hobby: z.number().describe("number of hobby this guy has"),
        })
        .array()
      const res = await llm.generate(span, {
        model: "small",
        messages: [
          {
            role: "user",
            content:
              "Generate a list of english dudes, then return the result.",
          },
        ],
        mustUseFunctions: true,
        functions: {
          result: {
            description: "Returns the result to the user.",
            returns: def,
          },
        },
      })
      expect(res.returns?.result).toBeDefined()
    }))

  test("root is stimulus", () =>
    fnSpan(undefined, "root is stimulus", async (span) => {
      const def = z.object({
        text: z
          .string()
          .describe(
            "The plain text content of the stimulus, this can be an excerpt from a historical document, a written treaty, or any other historical text. THIS SHOULD NOT BE A SUMMARY. The text that you quote should be relatively long, at least 5 sentences. You also have the option to describe a photograph or political cartoon in this field, if you do, set the 'image' field to TRUE.",
          ),
        attribution: z
          .string()
          .describe(
            "The author, organization, or source this text comes from.",
          ),
        image: z
          .boolean()
          .describe(
            "This should be set to TRUE if the 'text' field describes an image.",
          ),
      })

      const res = await llm.generate(span, {
        model: "big",
        systemText:
          "You are a high school history teacher employed by the collegeboard to create stimuli for questions on the AP US History exam.",
        messages: [
          {
            role: "user",
            content: `For this stimulus, create it for a multiple choice question pertaining to the unit 'Period 7', make sure to call the generate_stimulus function.`,
          },
        ],
        mustUseFunctions: true,
        functions: {
          generate_stimulus: {
            description: "Create a stimulus for the AP US History exam.",
            returns: def,
          },
        },
      })

      expect(res.returns?.generate_stimulus).toBeDefined()
    }))

  test("root is question obj", () =>
    fnSpan(undefined, "root is question obj", async (span) => {
      const def = z.object({
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
          .describe(
            "A list of potential answer for the multiple choice question.",
          ),
      })
      const res = await llm.generate(span, {
        model: "small",
        systemText:
          "You are a high school history teacher employed by the collegeboard to create multiple choice questions for the AP US History exam.",
        messages: [
          {
            role: "user",
            content: `Create a multiple choice question for the following stimulus pertaining to the unit 'Period 7', make sure to call the generate_mcq function.`,
          },
        ],
        mustUseFunctions: true,
        functions: {
          result: {
            description: "Returns the result to the user.",
            returns: def,
          },
        },
      })
      expect(res.returns?.result).toBeDefined()
    }))
})
