import { afterAll, beforeAll } from "vitest"
import { initializeOtel } from "./nodejs"

export function initializeOtelVitest(serviceName: string) {
  let shutdown!: () => Promise<void>
  beforeAll(() => {
    shutdown = initializeOtel(serviceName)
  })
  afterAll(() => {
    return shutdown()
  })
}
