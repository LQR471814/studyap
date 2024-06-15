import { LLMCache } from "@/lib/llm-cache/cache"
import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import * as schema from "@/lib/schema/schema"
import * as rels from "@/lib/schema/schema.relations"
import { createClient } from "@libsql/client"
import type { Span } from "@opentelemetry/api"
import { drizzle } from "drizzle-orm/libsql"
import type { Config } from "./config"
import { LLMGenerator } from "./generator"

export async function generate(span: Span | undefined, config: Config) {
  const db = drizzle(
    createClient({
      url: process.env.DATABASE_URL ?? "http://127.0.0.1:8080",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    }),
    { schema: { ...schema, ...rels } },
  )
  const llm = new LLMCache({ llm: isomorphicLLMFromEnv() })
  const generator = new LLMGenerator(db, llm, config)

  const res = await generator.generate(span)

  return [
    `----- GENERATION SUMMARY -----
SUBJECT: ${res.subject.name}
UNITS: ${res.units.length}
STIMULI (MCQ): ${res.stimuli.mcqs.length}
STIMULI (FRQ): ${res.stimuli.frqs.length}
MCQ: ${res.mcqs.length}
FRQ: ${res.frqs.length}`,
    res,
  ] as const
}
