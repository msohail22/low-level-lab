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
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		css: false,
		projects: [
			{
				extends: true,
				test: { name: 'unit', environment: 'jsdom', include: ['tests/unit/**/*.test.{ts,tsx}'] },
			},
			{
				// Real Postgres (PGlite) and real password hashing: slower, so longer timeouts.
				extends: true,
				test: {
					name: 'integration',
					environment: 'node',
					include: ['tests/integration/**/*.test.ts'],
					testTimeout: 30_000,
					hookTimeout: 60_000,
				},
			},
		],
	},
})
