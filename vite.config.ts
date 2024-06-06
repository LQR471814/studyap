import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import Icons from 'unplugin-icons/vite'
import path from "node:path"

export default defineConfig({
  publicDir: "./public",
  resolve: {
    alias: {
      "@": __dirname,
      "@ui-lib": path.resolve(__dirname, "./src/lib"),
    }
  },
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
    Icons({ compiler: 'svelte' }),
  ],
})

