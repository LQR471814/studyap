import { createDB } from "@/lib/db"
import { createClient } from "@libsql/client"
import type { Span } from "@opentelemetry/api"
import esMain from "es-main"
import { type Context, fnSpan, subjects, units } from "./constants"
import { frqs } from "./frq"
import { mcqs } from "./mcq"
import { stimuli } from "./stimuli"

export * from "./stimuli"
export * from "./frq"
export * from "./mcq"

export function generateAll(span: Span | undefined, ctx: Context) {
  return fnSpan(span, "generateAll", async () => {
    return {
      subject: await subjects(span, ctx),
      units: await units(span, ctx),
      stimuli: await stimuli(span, ctx),
      mcqs: await mcqs(span, ctx),
      frqs: await frqs(span, ctx),
    }
  })
}

if (esMain(import.meta)) {
  const db = createDB(
    createClient({
      url: "http://127.0.0.1:8080",
    }),
  )
  await generateAll(undefined, { db })
  console.log("added dummy data successfully")
  process.exit(0)
}
