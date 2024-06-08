import { OpenAI } from "openai"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
  ModelType,
} from "./core"
import zodToJsonSchema from "zod-to-json-schema"

export class Gpt implements LLM {
  ai: OpenAI

  constructor(apiKey: string) {
    this.ai = new OpenAI({ apiKey })
  }

  private getModel(modelType: ModelType) {
    switch (modelType) {
      case "big":
        return "gpt-4" as const
      case "small":
        return "gpt-3.5-turbo" as const
    }
  }

  async generate<F extends FunctionDefs>(
    options: GenerateRequest<F>,
  ): Promise<GenerateResult<F>> {
    const result = await this.ai.chat.completions.create({
      model: this.getModel(options.model),
      messages: [
        ...(options.systemText
          ? [
            {
              role: "system" as const,
              content: options.systemText,
            },
          ]
          : []),
        ...options.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      tools: Object.entries(options.functions).map(([name, fn]) => ({
        type: "function",
        function: {
          name,
          description: fn.description,
          parameters: zodToJsonSchema(fn.returns),
        },
      })),
    })

    const text = result.choices[0].message.content
    const calls = result.choices[0].message.tool_calls
    if (!calls) {
      return { text: text ?? "" }
    }

    // biome-ignore lint/suspicious/noExplicitAny: trust me
    const returns: any = {}
    for (const c of calls) {
      try {
        returns[c.function.name] = options.functions[
          c.function.name
        ].returns.parse(c.function.arguments)
      } catch { }
    }
    return { text: text ?? "", returns }
  }
}
