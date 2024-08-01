import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
} from "@/lib/llm/core"
import { createFnSpanner, narrowError } from "@/lib/telemetry/utils"
import { type Span, SpanStatusCode } from "@opentelemetry/api"
import Sqlite from "better-sqlite3"
import { eq } from "drizzle-orm"
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import PQueue from "p-queue"
import zodToJsonSchema from "zod-to-json-schema"
import * as schema from "./schema/schema"
import * as rels from "./schema/schema.relations"

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
  revalidateInProgress: Map<string, Promise<GenerateResult<FunctionDefs>>>

  constructor({ llm, queue, cacheFile }: LLMCacheOptions) {
    this.llm = llm
    this.queue =
      queue === undefined
        ? new PQueue({
            concurrency: 2,
            autoStart: true,
            // 10 per 10 seconds
            interval: 10 * 1000,
            intervalCap: 10,
            carryoverConcurrencyCount: true,
          })
        : queue
    this.db = drizzle(new Sqlite(cacheFile ?? "llm-cache.db"), {
      schema: { ...schema, ...rels },
    })

    this.revalidateInProgress = new Map()

    const __dirname = fileURLToPath(new URL(".", import.meta.url))
    migrate(this.db, {
      migrationsFolder: path.join(__dirname, "drizzle"),
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

  private async revalidate<F extends FunctionDefs>(
    span: Span | undefined,
    request: GenerateRequest<F>,
    hash?: string,
  ): Promise<GenerateResult<F>> {
    const id = hash ?? this.hashRequest(request)

    const existing = this.revalidateInProgress.get(id)
    if (existing) {
      return existing
    }

    console.log("revalidating LLM generation...", id)

    const revalidatePromise = fnSpan(span, "revalidate", async (span) => {
      if (span.isRecording()) {
        span.setAttribute("id", id)
      }

      const response = await this.generateWithTimeout(span, request)
      if (response instanceof LLMTimedOut) {
        throw response
      }
      if (response instanceof PromiseQueueDropped) {
        if (span.isRecording()) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "PROMISE QUEUE DROPPED REQUEST, this should never happen!",
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
        tx.delete(schema.completion).where(eq(schema.completion.id, id)).run()

        tx.insert(schema.completion)
          .values({
            id: id,
            text: response.text,
          })
          .run()

        if (response.returns && Object.entries(response.returns).length > 0) {
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
    })

    this.revalidateInProgress.set(id, revalidatePromise)
    return revalidatePromise
  }

  generate<F extends FunctionDefs>(
    span: Span | undefined,
    request: GenerateRequest<F>,
  ): Promise<GenerateResult<F>> {
    const id = this.hashRequest(request)

    return fnSpan(span, "generate", (span) => {
      if (span.isRecording()) {
        span.setAttribute("id", id)
      }

      const completion = this.db.query.completion
        .findFirst({
          with: {
            completionFunctionCall: true,
          },
          where: eq(schema.completion.id, id),
        })
        .sync()
      if (!completion) {
        console.log("cache miss...", id)

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

      console.log("cache hit...", id)

      if (span.isRecording()) {
        span.setStatus({
          code: SpanStatusCode.OK,
          message: "CACHE HIT",
        })
      }

      return Promise.resolve({
        text: completion.text,
        returns,
      })
    })
  }

  invalidate<F extends FunctionDefs>(
    span: Span | undefined,
    request: GenerateRequest<F>,
  ) {
    const id = this.hashRequest(request)
    return fnSpan(span, "invalidate", () => {
      this.db
        .delete(schema.completion)
        .where(eq(schema.completion.id, id))
        .run()
    })
  }
}
