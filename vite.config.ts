import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // Относительные пути в сборке — игра работает и в корне домена,
  // и в подпапке (например, на GitHub Pages).
  base: './',
  resolve: {
    alias: {
      // Единственный способ импортировать SDK: `import { ... } from '@sdk'`.
      // Благодаря этому граница SDK/игра видна в каждом файле игры.
      '@sdk': fileURLToPath(new URL('./src/sdk/index.ts', import.meta.url)),
    },
  },
})
