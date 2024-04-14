import { generateRandomSegments, retryAsyncFn } from "@/lib/utils"

test("generateRandomSegments", () => {
  for (let i = 0; i < 20; i++) {
    const segments = generateRandomSegments(10, [2, 5])
    expect(segments.length).toBeGreaterThan(0)
    for (const e of segments) {
      expect(Number.isInteger(e)).toBe(true)
      expect(e).toBeLessThanOrEqual(5)
    }
  }
  for (let i = 0; i < 20; i++) {
    const segments = generateRandomSegments(10, [0, 1])
    expect(segments.length).toBeGreaterThan(0)
    for (const e of segments) {
      expect(e).toBeGreaterThan(0)
    }
  }
  const segments = generateRandomSegments(1, [3, 5])
  expect(segments).toStrictEqual([1])
})

test("retryAsyncFn", async () => {
  {
    const res = await retryAsyncFn("no-retry", 3, async () => { return true })()
    expect(res).toBe(true)
  }
  {
    let i = 0
    const res = await retryAsyncFn("retry-twice", 3, async () => {
      if (++i > 2) {
        return true
      }
      throw new Error("error!")
    })()
    expect(res).toBe(true)
  }
  {
    const res = retryAsyncFn("fail", 5, async () => {
      throw new Error("error!")
    })()
    expect(res).rejects.toThrow(/fail failed 5 times in a row/)
  }
})

