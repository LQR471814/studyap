import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/schema/*.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "http://127.0.0.1:8080",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
})
