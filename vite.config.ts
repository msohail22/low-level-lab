import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { cloudflare } from '@cloudflare/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      {
        find: /^@(components|hooks|pages|routes|services)(\/.*)?$/,
        replacement:
          fileURLToPath(new URL('./src', import.meta.url)) + '/$1$2',
      },
    ],
  },
  plugins: [react(), tailwindcss(), cloudflare()],
})
