import { config } from "./config"
import { generate } from "../llm"
import { initializeOtel } from "@/lib/telemetry/nodejs"

initializeOtel("generator-cli:ap-us-history")

const [summary] = await generate(undefined, config)
console.log(summary)
process.exit(0)
