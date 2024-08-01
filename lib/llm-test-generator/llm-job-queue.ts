import { createHash } from "node:crypto"
import { fnSpan } from "@/api/tracer"
import type {
  FunctionDefs,
  GenerateRequest,
  GenerateResult,
  LLM,
} from "@/lib/llm/core"
import type { Span } from "@opentelemetry/api"
import zodToJsonSchema from "zod-to-json-schema"

/**
 * For debug use.
 */
function hashRequest<F extends FunctionDefs>(
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

export type LLMJob<F extends FunctionDefs, R> = {
  request: GenerateRequest<F>
  validate: (res: GenerateResult<F>) => Promise<R | undefined> | R | undefined
}

type queuedJob = {
  job: LLMJob<FunctionDefs, unknown>
  callback: (value: unknown) => void
}

export class LLMJobQueue {
  llm: LLM

  private queue: queuedJob[]

  constructor(llm: LLM) {
    this.llm = llm
    this.queue = []
  }

  private runJobs(parentSpan: Span | undefined) {
    return fnSpan(parentSpan, "LLMJobQueue:runJobs", async (span) => {
      const queued = this.queue.pop()
      if (!queued) {
        return
      }

      const requestHash = hashRequest(queued.job.request)
      console.log("[INFO] running llm generation job...", requestHash)

      for (let i = 0; i < 30; i++) {
        try {
          const response = await this.llm.generate(span, queued.job.request)
          const validated = queued.job.validate(response)
          if (!validated) {
            throw new Error("result was deemed invalid")
          }
          queued.callback(validated)

          console.log("[INFO] finished llm generation job...", requestHash)

          await this.runJobs(parentSpan)
          return
        } catch (err) {
          span.recordException(new Error(String(err)))
        }

        const timeout = 2 ** i
        console.log(
          `[WARN] generation job failed, retrying in ${timeout} seconds...`,
        )

        // exponential back off
        await new Promise((r) => setTimeout(r, timeout * 1000))
      }

      throw new Error("Failed 30 times to evaluate LLM request.")
    })
  }

  add<F extends FunctionDefs, R>(span: Span | undefined, job: LLMJob<F, R>) {
    return new Promise<R>((res) => {
      this.queue.push({
        job,
        callback: (value) => res(value as R),
      })
      if (this.queue.length === 1) {
        this.runJobs(span)
      }
    })
  }
}
