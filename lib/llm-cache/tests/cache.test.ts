import { isomorphicLLMFromEnv } from "@/lib/llm/isomorphic"
import { initializeOtelVitest } from "@/lib/telemetry/vitest"
import { expect, test } from "vitest"
import { LLMCache } from "../cache"
import { fnSpan } from "./singletons"

initializeOtelVitest("test:llm-cache")

const cache = new LLMCache({
  llm: isomorphicLLMFromEnv(),
  cacheFile: ":memory:",
})

test("generate", () => {
  return fnSpan(undefined, "generate", async (span) => {
    let t1 = performance.now()
    const result1 = await cache.generate(span, {
      model: "small",
      messages: [
        {
          role: "user",
          content: "How tall is the eiffel tower?",
        },
      ],
      functions: {},
    })
    let t2 = performance.now()

    const originalDuration = t2 - t1

    t1 = performance.now()
    const result2 = await cache.generate(span, {
      model: "small",
      messages: [
        {
          role: "user",
          content: "How tall is the eiffel tower?",
        },
      ],
      functions: {},
    })
    t2 = performance.now()

    expect(result2.text).toEqual(result1.text)

    const currentDuration = t2 - t1

    expect(currentDuration).toBeLessThan(originalDuration)
    // cache should be at least a second faster than original
    expect(originalDuration - currentDuration).toBeGreaterThan(300)

    const result3 = await cache.generate(span, {
      model: "small",
      messages: [
        {
          role: "user",
          content: "How tall is the tokyo tower?",
        },
      ],
      functions: {},
    })
    expect(result3.text).not.toEqual(result2.text)
  })
})

test("revalidate", () => {
  return fnSpan(undefined, "revalidate", async (span) => {
    const result = await cache.revalidate(span, {
      model: "small",
      messages: [
        {
          role: "user",
          content: "How tall is the eiffel tower?",
        },
      ],
      functions: {},
    })
    const resultCached = await cache.generate(span, {
      model: "small",
      messages: [
        {
          role: "user",
          content: "How tall is the eiffel tower?",
        },
      ],
      functions: {},
    })
    expect(resultCached.text).toEqual(result.text)

    const resultInvalidated = await cache.revalidate(span, {
      model: "small",
      messages: [
        {
          role: "user",
          content: "How tall is the eiffel tower?",
        },
      ],
      functions: {},
    })
    const resultCached2 = await cache.generate(span, {
      model: "small",
      messages: [
        {
          role: "user",
          content: "How tall is the eiffel tower?",
        },
      ],
      functions: {},
    })
    expect(resultCached2.text).toEqual(resultInvalidated.text)
  })
}, 30000)
