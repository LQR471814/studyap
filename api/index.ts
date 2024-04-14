import { getTest } from "@/generation/utils";
import { createDB } from "@/lib/db";
import { createClient } from "@libsql/client";
import { test } from "@/schema/tests"
import { AutoRouter, withContent } from "itty-router"
import { generators } from "@/generation/generators"
import OpenAI from "openai";
import type { FRQ, Stimulus } from "@/generation/types";
import { eq } from "drizzle-orm";

type Env = {
  OPENAI_API_KEY: string
  DATABASE_URL?: string
  DATABASE_AUTH_TOKEN?: string
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

    router.post("/evaluate/frq/:testId", withContent, async ({ content, testId }) => {
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      })
      const generatorList = generators(openai)

      if (content instanceof FormData || typeof content === "string") {
        return errorResponse(415, `you should post in JSON`)
      }

      // TODO: add more robust validation here later
      const typedContent = content as {
        stimulus: Stimulus<FRQ>,
        responses: string[],
      }

      const [{ subject }] = await db.select()
        .from(test)
        .where(eq(test.id, parseInt(testId)))

      const gen = generatorList.find(g => g.subject === subject)
      if (!gen) {
        throw new Error(`could not find generator with subject ${subject}`)
      }

      return jsonResponse(
        await gen.evaluateFrq(typedContent.stimulus, typedContent.responses)
      )
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
