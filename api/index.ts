import { getTest } from "@/generation/utils";
import { createDB } from "@/lib/db";
import { createClient } from "@libsql/client";
import { test } from "@/schema/tests"
import { AutoRouter } from "itty-router"

type Env = {
  DATABASE_URL?: string
  DATABASE_AUTH_TOKEN?: string
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS
    }
  })
}

function errorResponse(status: number, err: string): Response {
  return new Response(err, { status: status, headers: CORS_HEADERS })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const db = createDB(createClient({
      url: env.DATABASE_URL ?? "http://127.0.0.1:8080",
      authToken: env.DATABASE_AUTH_TOKEN
    }))

    const router = AutoRouter()

    router.options("*", () => {
      return new Response("ok", { headers: CORS_HEADERS });
    })

    router.get("/test/:id", async ({ id }) => {
      try {
        const test = await getTest(db, parseInt(id))
        return jsonResponse(test)
      } catch (err) {
        if (err instanceof Error && err.message.includes("could not find")) {
          return errorResponse(404, `could not find test with id ${id} `)
        }
        throw err
      }
    })

    router.get("/tests", async () => {
      const tests = await db.select().from(test)
      const transformed = tests.map(t => ({
        id: t.id,
        subject: t.subject,
      }))
      return jsonResponse(transformed)
    })

    return router.fetch(request)
  },
};
