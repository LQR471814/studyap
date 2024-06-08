import { createDB } from "@/lib/db"
import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import { createClient } from "@libsql/client"
import esMain from "es-main"
import { type Context, context } from "../context"
import { generateFrqs } from "./frq"
import { generateMcqs } from "./mcq"
import { generateStimuli } from "./stimuli"
import { generateSubject } from "./subject"
import { generateUnits } from "./units"

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
  const llm = isomorphicLLMFromEnv()
  await generateAll(context(db, llm))
  console.log("added AP US History data successfully")
  process.exit(0)
}
