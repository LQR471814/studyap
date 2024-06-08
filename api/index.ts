import { createDB } from "@/lib/db"
import { router } from "./router"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { createClient } from "@libsql/client"
import { isomorphicLLM } from "@/lib/llm/isomorphic"

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
}

export type Env = {
  OPENAI_API_KEY?: string
  GOOGLE_API_KEY?: string
  DATABASE_URL?: string
  DATABASE_AUTH_TOKEN?: string
}

function database(env: Env) {
  return createDB(
    createClient({
      url: env.DATABASE_URL ?? "http://127.0.0.1:8080",
      authToken: env.DATABASE_AUTH_TOKEN,
    }),
  )
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      const res = new Response(undefined, {
        headers: CORS_HEADERS,
      })
      return res
    }
    const res = await fetchRequestHandler({
      endpoint: "/",
      req: request,
      router: router,
      createContext() {
        return {
          db: database(env),
          userEmail: "testuser@gmail.com",
          llm: isomorphicLLM({
            openai: env.OPENAI_API_KEY,
            google: env.GOOGLE_API_KEY,
          }),
        }
      },
    })
    for (const key in CORS_HEADERS) {
      res.headers.set(key, CORS_HEADERS[key])
    }
    return res
  },
}
