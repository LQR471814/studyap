import type { Test } from "@/generation/types"
import { z } from "zod"

const apiEndpoint = new URL(import.meta.env.VITE_API_URL)

const testList = z.array(z.object({
  id: z.number(),
  subject: z.string()
}))

export async function getTestList() {
  const res = await fetch(new URL("/tests", apiEndpoint))
  return testList.parse(await res.json())
}

export async function getTest(id: number) {
  const res = await fetch(new URL(`/test/${id}`, apiEndpoint))
  return await res.json() as Test
}

