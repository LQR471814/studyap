import { GoogleGenerativeAI } from "@google/generative-ai"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
  ModelType,
} from "./core"
import { zodToJsonSchema } from "zod-to-json-schema"
import jsonSchemaToOpenapiSchema from "@openapi-contrib/json-schema-to-openapi-schema"

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
          functionDeclarations: await Promise.all(
            Object.entries(options.functions).map(async ([name, fn]) => {
              const parameters = await jsonSchemaToOpenapiSchema(
                zodToJsonSchema(fn.returns),
              )
              return {
                name: name,
                description: fn.description,
                // biome-ignore lint/suspicious/noExplicitAny: trust me
                parameters: parameters as any,
              }
            }),
          ),
        },
      ],
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
          call.args,
        )
      } catch { }
    }

    return { text, returns }
  }
}
