import { createFnSpanner, narrowError } from "@/lib/telemetry/utils"
import { FunctionCallingMode, GoogleGenerativeAI } from "@google/generative-ai"
import { type Span, SpanStatusCode } from "@opentelemetry/api"
import { unwrapObject, zodToGeminiSchema } from "zod-to-gemini-schema"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
  ModelType,
} from "./core"

const fnSpan = createFnSpanner("google-llm")

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
    span: Span | undefined,
    request: GenerateRequest<F>,
  ): Promise<GenerateResult<F>> {
    return fnSpan(span, "generate", async (span) => {
      if (span.isRecording()) {
        span.setAttribute("request", JSON.stringify(request))
      }

      const modelName = this.getModel(request.model)

      if (span.isRecording()) {
        span.setAttribute("model", modelName)
      }

      const functionDeclarations = Object.entries(request.functions).map(
        ([name, fn]) => {
          const parameters = zodToGeminiSchema(fn.returns)
          return {
            name: name,
            description: fn.description,
            // // biome-ignore lint/suspicious/noExplicitAny: this should be okay
            // parameters: parameters as any,
            // for some reason gemini don't work if the root object isn't an object
            parameters: parameters,
          }
        },
      )

      if (span.isRecording()) {
        span.setAttribute("functions", JSON.stringify(functionDeclarations))
      }

      const tools = [{ functionDeclarations }]
      const toolConfig = {
        functionCallingConfig: {
          mode: request.mustUseFunctions
            ? FunctionCallingMode.ANY
            : FunctionCallingMode.AUTO,
        },
      }

      if (span.isRecording()) {
        span.setAttribute("tool_config", JSON.stringify(toolConfig))
      }

      const model = this.ai.getGenerativeModel({
        model: modelName,
        tools,
        toolConfig,
      })

      const result = await model.generateContent(
        request.messages.map((m) => ({ text: m.content })),
      )

      if (span.isRecording()) {
        span.addEvent("got result", {
          candidates: JSON.stringify(result.response.candidates),
          usage: result.response.usageMetadata
            ? JSON.stringify(result.response.usageMetadata)
            : "undefined",
          feedback: result.response.promptFeedback
            ? JSON.stringify(result.response.promptFeedback)
            : "undefined",
        })
      }

      const candidate = result.response.candidates?.[0]
      if (!candidate) {
        if (span.isRecording()) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Undefined candidate? This is probably an error.",
          })
        }

        return { text: "" }
      }
      // this can be undefined for some reason?
      if (!candidate.content) {
        if (span.isRecording()) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "Undefined content? This is probably an error.",
          })
        }

        return { text: "" }
      }

      const text = candidate.content.parts
        .filter((part) => part.text)
        .map((part) => part.text)
        .join("\n")

      if (span.isRecording()) {
        span.addEvent("got processed text", { processed_text: text })
      }

      // biome-ignore lint/suspicious/noExplicitAny: trust me
      const returns: any = {}
      for (const { functionCall: call } of candidate.content.parts) {
        if (!call) {
          continue
        }

        try {
          returns[call.name] = request.functions[call.name].returns.parse(
            unwrapObject(call.args),
          )
        } catch (err) {
          if (span.isRecording()) {
            span.recordException(narrowError(err))
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message:
                "Got an error while parsing function args, this is probably an error.",
            })
          }
        }
      }

      if (span.isRecording()) {
        span.addEvent("got returns", { returns: JSON.stringify(returns) })
      }

      return { text, returns }
    })
  }
}
