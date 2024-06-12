import { config } from "./config"
import { generate } from "../llm"
import { initializeOtel } from "@/lib/telemetry/nodejs"

initializeOtel("generator-cli:apush-dev", true)
const [summary, res] = await generate(undefined, config)

console.log(summary)
console.log("\n----- STIMULI -----\n")
console.dir(res.stimuli, { depth: 8 })
console.log("\n----- MCQs -----\n")
console.dir(res.mcqs, { depth: 8 })
console.log("\n----- FRQs -----\n")
console.dir(res.frqs, { depth: 8 })

process.exit(0)

