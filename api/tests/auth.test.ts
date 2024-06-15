import { expect, test } from "vitest"
import { generateCode, generateToken } from "../auth"
import { createFnSpanner } from "@/lib/telemetry/utils"

const fnSpan = createFnSpanner("test_auth")

test("generateCode", () => {
  fnSpan(undefined, "generateCode", (span) => {
    const code = generateCode()
    const regex = /[\dA-F\-]{9}/
    span.addEvent("code", { "custom.code": code })
    expect(code.match(regex)).not.toBeNull()
  })
})

test("generateToken", () => {
  fnSpan(undefined, "generateToken", (span) => {
    const token = generateToken()
    const regex = /[\dA-Z]{32}/
    span.addEvent("token", { "custom.token": token })
    expect(token.match(regex)).not.toBeNull()
  })
})
