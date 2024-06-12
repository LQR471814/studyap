import { createDB } from "@/lib/db"
import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import { createClient } from "@libsql/client"
import esMain from "es-main"
import { generateSubject, generateUnits, type Context } from "./constants"
import { generateFrqs } from "./frq"
import { generateMcqs } from "./mcq"
import { generateStimuli } from "./stimuli"
import { LLMCache } from "@/lib/llm-cache/cache"

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
  await generateAll({ db, llm: new LLMCache({ llm }) })
  console.log("added dummy data successfully")
  process.exit(0)
}
