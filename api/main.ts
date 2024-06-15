import { createDB } from "@/lib/db"
import { isomorphicLLM } from "@/lib/llm/isomorphic"
import { Mailgun } from "@/lib/mailgun"
import { createClient } from "@libsql/client"
import { trace } from "@opentelemetry/api"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { verifyToken } from "./auth"
import { protectedRouter } from "./protected"
import { publicRouter } from "./public"

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, *",
}

export type Env = {
  OPENAI_API_KEY?: string
  GOOGLE_API_KEY?: string

  DATABASE_URL?: string
  DATABASE_AUTH_TOKEN?: string

  HONEYCOMB_API_KEY?: string

  MAILGUN_API_KEY: string
  MAILGUN_DOMAIN: string
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

    const span = trace.getActiveSpan()
    if (!span) {
      throw new Error("Root span is undefined.")
    }

    const mailgun = new Mailgun(env.MAILGUN_API_KEY, env.MAILGUN_DOMAIN)

    const url = new URL(request.url)

    if (url.pathname.startsWith("/protected")) {
      const token = request.headers.get("authorization")?.split(" ")[1]
      if (!token) {
        return new Response("Unauthorized.", { status: 401 })
      }

      const db = database(env)
      const userEmail = await verifyToken(span, db, token)
      if (!userEmail) {
        return new Response("Unauthorized.", { status: 401 })
      }

      const res = await fetchRequestHandler({
        endpoint: "/protected",
        req: request,
        router: protectedRouter,
        createContext() {
          return {
            span,
            db,
            userEmail,
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
    }

    if (url.pathname.startsWith("/public")) {
      const res = await fetchRequestHandler({
        endpoint: "/public",
        req: request,
        router: publicRouter,
        createContext() {
          return {
            span: span,
            db: database(env),
            mailgun,
          }
        },
      })
      for (const key in CORS_HEADERS) {
        res.headers.set(key, CORS_HEADERS[key])
      }
      return res
    }

    return new Response("not found.", {
      status: 404,
    })
  },
}
