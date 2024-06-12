import { initTRPC } from "@trpc/server"
import type { DB } from "@/lib/db"
import superjson from "superjson"
import type { LLM } from "@/lib/llm/core"
import type { Span } from "@opentelemetry/api"

export type Context = {
  span: Span
  db: DB
  llm: LLM
  userEmail: string
}
export const t = initTRPC.context<Context>().create({
  transformer: superjson,
})
