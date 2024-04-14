import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  resolve: {
    alias: {
      "@": __dirname,
    }
  },
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
  ],
})

