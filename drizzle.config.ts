import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./schema/*.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:database.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
  },
  verbose: true,
  strict: true,
})
