import path from "node:path"
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import Icons from "unplugin-icons/vite"
import { defineConfig } from "vite"

export default defineConfig({
  publicDir: "./public",
  resolve: {
    alias: {
      "@": __dirname,
      "@ui-lib": path.resolve(__dirname, "./src/lib"),
    },
  },
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
    Icons({ compiler: "svelte" }),
  ],
})
