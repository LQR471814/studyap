import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/llm-cache/schema/*.ts",
  out: "./lib/llm-cache/drizzle",
  verbose: true,
  strict: true,
})
