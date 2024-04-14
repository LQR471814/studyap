import type { FRQ, FRQEval, Stimulus, Test } from "@/generation/types"
import { z } from "zod"

const apiEndpoint = new URL(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787")

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

export async function evaluateFrq(
  testId: number,
  stimulus: Stimulus<FRQ>,
  responses: string[]
) {
  const res = await fetch(
    new URL(`/evaluate/frq/${testId}`, apiEndpoint),
    {
      method: "POST",
      body: JSON.stringify({
        stimulus,
        responses,
      }),
      headers: {
        "content-type": "application/json"
      }
    }
  )
  return await res.json() as FRQEval[]
}

