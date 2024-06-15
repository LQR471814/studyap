import type { LLM } from "./core"
import { Gemini } from "./google"
import { Gpt } from "./openai"

export type Services = {
  openai: string
  google: string
}

/**
 * Creates an LLM based on the only api key that is provided.
 */
export function isomorphicLLM(apiKeys: Partial<Services>): LLM {
  let apiKey: string | undefined
  let service!: keyof Services

  for (const [name, key] of Object.entries(apiKeys)) {
    if (apiKey && key) {
      throw new Error("More than one api key has been provided.")
    }
    if (key) {
      apiKey = key
      service = name as keyof Services
    }
  }

  switch (service) {
    case "openai":
      return new Gpt(apiKey!)
    case "google":
      return new Gemini(apiKey!)
  }
}

export function isomorphicLLMFromEnv(): LLM {
  return isomorphicLLM({
    openai: process.env.OPENAI_API_KEY,
    google: process.env.GOOGLE_API_KEY,
  })
}
