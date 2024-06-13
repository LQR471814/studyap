import { expect, test } from "vitest"
import { generateCode, generateToken } from "../auth"

test("generateCode", () => {
  const code = generateCode()
  const regex = /[\dA-F\-]{9}/
  console.log(code)
  expect(code.match(regex)).not.toBeNull()
})

test("generateToken", () => {
  const token = generateToken()
  const regex = /[\dA-Z]{32}/
  console.log(token)
  expect(token.match(regex)).not.toBeNull()
})
