import { createClient } from "@libsql/client"
import { createDB } from "@/lib/db"
import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const db = createDB(createClient({
  url: process.env.DATABASE_URL ?? "http://127.0.0.1:8080",
  authToken: process.env.DATABASE_AUTH_TOKEN,
}))

