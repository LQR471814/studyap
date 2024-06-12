import { retryAsyncFn } from "@/lib/utils"
import { test, expect } from "vitest"

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

