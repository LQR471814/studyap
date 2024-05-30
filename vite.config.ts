import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
  publicDir: "./public",
  resolve: {
    alias: {
      "@": __dirname,
    }
  },
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
    }),
    Icons({ compiler: 'svelte' }),
  ],
})

