import {
  FunctionCallingMode,
  FunctionDeclarationSchemaType,
  GoogleGenerativeAI,
} from "@google/generative-ai"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
  ModelType,
} from "./core"
import { zodToJsonSchema } from "zod-to-json-schema"

function removeAdditionalProperties(val: unknown) {
  if (typeof val === "object" && val !== null) {
    if ("additionalProperties" in val) {
      // biome-ignore lint/performance/noDelete: this is necessary
      delete val.additionalProperties
    }
    for (const key in val) {
      // biome-ignore lint/suspicious/noExplicitAny: trust me
      removeAdditionalProperties((val as any)[key])
    }
  }
}

export class Gemini implements LLM {
  ai: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey)
  }

  private getModel(modelType: ModelType): string {
    switch (modelType) {
      case "big":
        // almost meets gpt-4 performance at fraction of cost
        return "gemini-1.5-flash-latest"
      case "small":
        return "gemini-1.5-flash-latest"
    }
  }

  async generate<F extends FunctionDefs>(
    options: GenerateRequest<F>,
  ): Promise<GenerateResult<F>> {
    const model = this.ai.getGenerativeModel({
      model: this.getModel(options.model),
      tools: [
        {
          functionDeclarations: Object.entries(options.functions).map(
            ([name, fn]) => {
              const parameters = zodToJsonSchema(fn.returns, {
                target: "openApi3",
              })
              removeAdditionalProperties(parameters)
              return {
                name: name,
                description: fn.description,
                // for some reason gemini don't work if the root object isn't an object
                parameters: {
                  type: FunctionDeclarationSchemaType.OBJECT,
                  required: ["result"],
                  properties: {
                    // biome-ignore lint/suspicious/noExplicitAny: this should be okay
                    result: parameters as any,
                  },
                },
              }
            },
          ),
        },
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: options.mustUseFunctions
            ? FunctionCallingMode.ANY
            : FunctionCallingMode.AUTO,
        },
      },
    })

    const result = await model.generateContent(
      options.messages.map((m) => ({ text: m.content })),
    )
    const text = result.response.text()
    const calls = result.response.functionCalls()
    if (!calls) {
      return { text }
    }

    // biome-ignore lint/suspicious/noExplicitAny: trust me
    const returns: any = {}
    for (const call of calls) {
      try {
        returns[call.name] = options.functions[call.name].returns.parse(
          // biome-ignore lint/suspicious/noExplicitAny: this should be okay
          (call.args as any).result,
        )
      } catch { }
    }

    return { text, returns }
  }
}
