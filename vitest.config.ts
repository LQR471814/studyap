import path from "node:path"
/// <reference types="vitest" />
import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    alias: {
      "@": __dirname,
      "@ui-lib": path.resolve(__dirname, "./src/lib"),
    },
  },
  test: {
    server: {
      deps: {
        inline: ["@opentelemetry/resources"],
      },
    },
  },
})
