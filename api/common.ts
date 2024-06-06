import { initTRPC } from "@trpc/server"
import type { DB } from "@/lib/db"
import type { OpenAI } from "openai"

export type Context = {
  db: DB
  openai: OpenAI
  userEmail: string
}
export const t = initTRPC.context<Context>().create()

