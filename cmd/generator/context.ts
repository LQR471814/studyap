import type { DB } from "@/lib/db"
import type OpenAI from "openai"
import PQueue from "p-queue"

export type Context = {
  openai: OpenAI
  openaiQueue: PQueue
  db: DB
}

export function context(db: DB, openai: OpenAI) {
  return {
    openai,
    db,
    openaiQueue: new PQueue({
      concurrency: 4,
      autoStart: true,
      // 1 minute
      interval: 60 * 1000,
      intervalCap: 60,
    }),
  }
}

