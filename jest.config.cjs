/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/$1",
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
}
