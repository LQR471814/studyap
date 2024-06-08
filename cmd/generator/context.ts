import type { DB } from "@/lib/db"
import type { LLM } from "@/lib/llm/core"
import PQueue from "p-queue"

export type Context = {
  llm: LLM
  llmQueue: PQueue
  db: DB
}

export function context(db: DB, llm: LLM): Context {
  return {
    llm,
    db,
    llmQueue: new PQueue({
      concurrency: 4,
      autoStart: true,
      // 1 minute
      interval: 60 * 1000,
      intervalCap: 60,
    }),
  }
}

