import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'

import { createDatabase } from './db/client.js'

export function createAuth(env: Env, request: Request) {
	const db = createDatabase(env)
	const baseURL = env.BETTER_AUTH_URL ?? new URL(request.url).origin

	return betterAuth({
		baseURL,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: 'pg',
		}),
		emailAndPassword: {
			enabled: true,
		},
	})
}
