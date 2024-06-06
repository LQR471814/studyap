import esMain from "es-main"
import { generateSubject } from "./subject"
import { Context, context } from "../context"
import { createDB } from "@/lib/db"
import { createClient } from "@libsql/client"
import OpenAI from "openai"
import { generateUnits } from "./units"
import { generateStimuli } from "./stimuli"
import { generateMcqs } from "./mcq"
import { generateFrqs } from "./frq"

export * from "./subject"
export * from "./units"
export * from "./stimuli"
export * from "./frq"
export * from "./mcq"

export async function generateAll(ctx: Context) {
  const subject = await generateSubject(ctx)
  const units = await generateUnits(ctx)
  const stimuli = await generateStimuli(ctx)
  const mcqs = await generateMcqs(ctx)
  const frqs = await generateFrqs(ctx)
  return { subject, units, stimuli, mcqs, frqs }
}

if (esMain(import.meta)) {
  const db = createDB(
    createClient({
      url: "http://127.0.0.1:8080",
    }),
  )
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  generateAll(context(db, openai))
  process.exit(0)
}
