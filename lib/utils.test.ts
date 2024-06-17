import { heuristicUnescape, retryAsyncFn } from "@/lib/utils"
import { expect, test } from "vitest"

test("retryAsyncFn", async () => {
  {
    const res = await retryAsyncFn("no-retry", 3, async () => {
      return true
    })()
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

test("heuristicUnescape", () => {
  const testTable: {
    test: string
    expect: string
  }[] = [
    {
      test: `\\"we are a family of four\\"`,
      expect: `"we are a family of four"`
    },
    {
      test: "FIND_BIN=\\$(which find)",
      expect: "FIND_BIN=$(which find)",
    },
    {
      test: "nothing happens",
      expect: "nothing happens",
    }
  ]

  for (const testCase of testTable) {
    const result = heuristicUnescape(testCase.test)
    expect(result).toBe(testCase.expect)
  }
})

