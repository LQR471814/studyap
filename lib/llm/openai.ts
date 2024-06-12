import { OpenAI } from "openai"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
  ModelType,
} from "./core"
import zodToJsonSchema from "zod-to-json-schema"
import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionTool,
} from "openai/resources/chat/completions.mjs"
import { SpanStatusCode, type Span } from "@opentelemetry/api"
import { createFnSpanner, narrowError } from "@/lib/telemetry/utils"

const fnSpan = createFnSpanner("openai-llm")

export class Gpt implements LLM {
  ai: OpenAI

  constructor(apiKey: string) {
    this.ai = new OpenAI({ apiKey })
  }

  private getModel(
    modelType: ModelType,
  ): ChatCompletionCreateParamsBase["model"] {
    switch (modelType) {
      case "big":
        // TODO: switch to gpt-4 once done testing
        return "gpt-3.5-turbo"
      case "small":
        return "gpt-3.5-turbo"
    }
  }

  async generate<F extends FunctionDefs>(
    span: Span | undefined,
    request: GenerateRequest<F>,
  ): Promise<GenerateResult<F>> {
    return fnSpan(span, "generate", async (span) => {
      if (span.isRecording()) {
        span.setAttribute("request", JSON.stringify(request))
      }

      const model = this.getModel(request.model)
      if (span.isRecording()) {
        span.setAttribute("model", model)
      }

      const messages = [
        ...(request.systemText
          ? [
            {
              role: "system" as const,
              content: request.systemText,
            },
          ]
          : []),
        ...request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ]
      const tools = Object.entries(request.functions).map(
        ([name, fn]): ChatCompletionTool => ({
          type: "function",
          function: {
            name,
            description: fn.description,
            parameters: zodToJsonSchema(fn.returns),
          },
        }),
      )
      if (span.isRecording()) {
        span.setAttribute("functions", JSON.stringify(tools.map((t) => t.function)))
      }

      const result = await this.ai.chat.completions.create({
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
      })

      if (span.isRecording()) {
        span.addEvent("got completion result", {
          usage: result.usage ? JSON.stringify(result.usage) : "undefined",
          choices: JSON.stringify(result.choices),
        })
      }

      const text = result.choices[0].message.content
      const calls = result.choices[0].message.tool_calls

      if (span.isRecording()) {
        span.addEvent("got text & tool_calls", {
          text: text ?? "null",
          calls: JSON.stringify(calls?.map(c => c.function.name) ?? null)
        })
      }

      if (!calls) {
        return { text: text ?? "" }
      }

      // biome-ignore lint/suspicious/noExplicitAny: trust me
      const returns: any = {}
      for (const c of calls) {
        try {
          returns[c.function.name] = request.functions[
            c.function.name
          ].returns.parse(JSON.parse(c.function.arguments))
        } catch (err) {
          const error = narrowError(err)
          span.recordException(error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `Got error while attempting to parse returned function args: ${error.message}`,
          })
        }
      }

      if (span.isRecording()) {
        span.addEvent("got returns", {
          returns: JSON.stringify(returns),
        })
      }

      return { text: text ?? "", returns }
    })
  }
}
