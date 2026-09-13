import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { authSchema } from './db/schema.js'

export function createAuth(env: Env, request: Request) {
	const pool = new Pool({
		connectionString: env.LOW_LEVEL_LAB_DB.connectionString,
		max: 1,
	})
	const db = drizzle(pool, { schema: authSchema })
	const baseURL = env.BETTER_AUTH_URL ?? new URL(request.url).origin

	return betterAuth({
		baseURL,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: authSchema,
		}),
		emailAndPassword: {
			enabled: true,
		},
	})
}
