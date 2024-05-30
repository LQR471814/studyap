import { initTRPC } from "@trpc/server"
import { user } from "@/lib/schema/schema"
import { createDB } from "@/lib/db"
import { createClient } from "@libsql/client"

export type Env = {
  OPENAI_API_KEY: string
  DATABASE_URL?: string
  DATABASE_AUTH_TOKEN?: string
}

function database(env: Env) {
  return createDB(createClient({
    url: env.DATABASE_URL ?? "http://127.0.0.1:8080",
    authToken: env.DATABASE_AUTH_TOKEN
  }))
}

const t = initTRPC.context<Env>().create()

export const router = t.router({
  data: t.procedure.query(async ({ ctx }) => {
    const db = database(ctx)
    return await db.select().from(user)
  })
})

export type Router = typeof router

