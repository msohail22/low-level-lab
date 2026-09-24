import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Every test in the repository lives under tests/ — one place to look.
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: [
			{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
			{
				find: /^@(components|hooks|pages|routes|services)(\/.*)?$/,
				replacement: fileURLToPath(new URL('./src', import.meta.url)) + '/$1$2',
			},
		],
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		include: ['tests/**/*.test.{ts,tsx}'],
		css: false,
	},
})
