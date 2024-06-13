import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
} from "@/lib/llm/core"
import * as schema from "./schema/schema"
import * as rels from "./schema/schema.relations"
import { eq } from "drizzle-orm"
import Sqlite from "better-sqlite3"
import path from "node:path"
import PQueue from "p-queue"
import {
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
} from "@google/generative-ai"
import {
  APIConnectionError,
  RateLimitError,
  InternalServerError,
  APIConnectionTimeoutError,
  APIUserAbortError,
} from "openai"
import { type Span, SpanStatusCode } from "@opentelemetry/api"
import { createFnSpanner, narrowError } from "@/lib/telemetry/utils"
import { createHash } from "node:crypto"
import zodToJsonSchema from "zod-to-json-schema"
import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"

const fnSpan = createFnSpanner("llm-cache")

export type LLMCacheOptions = {
  llm: LLM
  /**
   * If this is left undefined, it will assume a default queue
   */
  queue?: PQueue | null
  /**
   * This can be set to `:memory:` to only cache in-memory.
   */
  cacheFile?: string
}

class PromiseQueueDropped extends Error {
  constructor() {
    super("Promise queue dropped revalidate request!")
  }
}

class LLMTimedOut extends Error {
  constructor() {
    super("The request to the LLM timed out.")
  }
}

export class LLMCache {
  db: BetterSQLite3Database<typeof schema & typeof rels>
  llm: LLM
  queue: PQueue | null

  constructor({ llm, queue, cacheFile }: LLMCacheOptions) {
    this.llm = llm
    this.queue =
      queue === undefined
        ? new PQueue({
          concurrency: 3,
          autoStart: true,
          // 1 minute
          interval: 10 * 1000,
          intervalCap: 3,
          carryoverConcurrencyCount: true,
        })
        : queue
    this.db = drizzle(new Sqlite(cacheFile ?? "llm-cache.db"), {
      schema: { ...schema, ...rels },
    })

    const __dirname = fileURLToPath(new URL('.', import.meta.url))
    migrate(this.db, {
      migrationsFolder: path.join(
        __dirname,
        "drizzle",
      ),
    })
  }

  private async generateWithTimeout<F extends FunctionDefs>(
    span: Span | undefined,
    request: GenerateRequest<F>,
  ): Promise<GenerateResult<F> | PromiseQueueDropped | LLMTimedOut> {
    const call = () =>
      fnSpan(span, "generateWithTimeout", (span) => {
        if (span.isRecording()) {
          span.setAttribute("messages", request.messages.length)
          span.setAttribute("functions", Object.keys(request.functions).length)
        }

        return Promise.race([
          this.llm.generate(span, request),
          new Promise<Error>((r) => {
            setTimeout(() => {
              r(new LLMTimedOut())
            }, 30000)
          }),
        ])
      })

    if (this.queue) {
      const res = await this.queue.add(call)
      if (res === undefined) {
        return new PromiseQueueDropped()
      }
      return res
    }
    return await call()
  }

  private hashRequest<F extends FunctionDefs>(
    request: GenerateRequest<F>,
  ): string {
    const string =
      request.model +
      (request.systemText ?? "") +
      (request.mustUseFunctions ?? false) +
      request.messages.map((m) => m.role + m.content).join("") +
      Object.entries(request.functions)
        .map(([name, fn]) => {
          return (
            name +
            (fn.description ?? "") +
            JSON.stringify(zodToJsonSchema(fn.returns))
          )
        })
        .join("")
    return createHash("md5").update(string).digest("hex")
  }

  async revalidate<F extends FunctionDefs>(
    span: Span | undefined,
    request: GenerateRequest<F>,
    hash?: string,
  ): Promise<GenerateResult<F>> {
    const id = hash ?? this.hashRequest(request)

    return fnSpan(span, "revalidate", async (span) => {
      if (span.isRecording()) {
        span.setAttribute("id", id)
      }

      for (let i = 0; i < 5; i++) {
        if (span.isRecording()) {
          span.addEvent("running generation request...", { attempt: i + 1 })
        }

        try {
          const response = await this.generateWithTimeout(span, request)
          if (response instanceof LLMTimedOut) {
            throw response
          }
          if (response instanceof PromiseQueueDropped) {
            if (span.isRecording()) {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message:
                  "PROMISE QUEUE DROPPED REQUEST, this should never happen!",
              })
            }
            throw response
          }

          if (span.isRecording()) {
            span.addEvent("response.returns", {
              returns_length: response.returns
                ? Object.keys(response.returns).length
                : "undefined",
            })
          }

          this.db.transaction((tx) => {
            tx.delete(schema.completion)
              .where(eq(schema.completion.id, id))
              .run()

            tx.insert(schema.completion)
              .values({
                id: id,
                text: response.text,
              })
              .run()

            if (
              response.returns &&
              Object.entries(response.returns).length > 0
            ) {
              tx.insert(schema.completionFunctionCall)
                .values(
                  Object.entries(response.returns).map(([name, returns]) => ({
                    completionId: id,
                    functionName: name,
                    result: JSON.stringify(returns),
                  })),
                )
                .run()
            }
          })

          if (span.isRecording()) {
            span.addEvent("CACHE ADD", {
              id: id,
              function_returns: response.returns
                ? JSON.stringify(Object.keys(response.returns))
                : "<EMPTY FUNCTION RETURN>",
            })
          }

          return response
        } catch (err) {
          if (
            !(
              err instanceof PromiseQueueDropped ||
              err instanceof LLMTimedOut ||
              // gemini
              err instanceof GoogleGenerativeAIFetchError ||
              err instanceof GoogleGenerativeAIResponseError ||
              // openai
              err instanceof APIConnectionError ||
              err instanceof RateLimitError ||
              err instanceof InternalServerError ||
              err instanceof APIConnectionTimeoutError ||
              err instanceof APIUserAbortError
            )
          ) {
            throw err
          }

          span.recordException(narrowError(err))
          span.addEvent(
            "caught an error while attempting to run LLM generate request, retrying...",
            { "log.severity": "WARN" },
          )

          await new Promise((r) => setTimeout(r, 2 ** i * 1000))
        }
      }

      if (span.isRecording()) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: "Failed to revalidate cache after retrying 5 times...",
        })
      }
      throw new Error("Failed to revalidate cache after retrying 5 times...")
    })
  }

  async generate<F extends FunctionDefs>(
    span: Span | undefined,
    request: GenerateRequest<F>,
  ): Promise<GenerateResult<F>> {
    const id = this.hashRequest(request)

    return fnSpan(span, "generate", async (span) => {
      if (span.isRecording()) {
        span.setAttribute("id", id)
      }

      const completion = await this.db.query.completion.findFirst({
        with: {
          completionFunctionCall: true,
        },
        where: eq(schema.completion.id, id),
      })
      if (!completion) {
        if (span.isRecording()) {
          span.setStatus({
            code: SpanStatusCode.OK,
            message: "CACHE MISS",
          })
        }

        return this.revalidate(span, request, id)
      }

      const returns: Record<string, unknown> = {}
      for (const call of completion.completionFunctionCall) {
        try {
          returns[call.functionName] = request.functions[
            call.functionName
          ].returns.parse(JSON.parse(call.result))
        } catch (err) {
          if (span.isRecording()) {
            span.recordException(narrowError(err))
            span.addEvent("ERROR in parsing cache, refreshing...")
            span.setStatus({
              code: SpanStatusCode.OK,
              message: "CACHE MISS",
            })
          }

          return this.revalidate(span, request, id)
        }
      }

      if (span.isRecording()) {
        span.setStatus({
          code: SpanStatusCode.OK,
          message: "CACHE HIT",
        })
      }

      return {
        text: completion.text,
        returns,
      }
    })
  }
}
