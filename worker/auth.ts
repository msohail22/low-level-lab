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
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				await env.LOW_LEVEL_LAB_QUEUE.send({
					type: 'password-reset',
					to: user.email,
					url,
				})
			},
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				await env.LOW_LEVEL_LAB_QUEUE.send({
					type: 'email-verification',
					to: user.email,
					url,
				})
			},
		},
		socialProviders: {
			...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: env.GOOGLE_CLIENT_ID,
							clientSecret: env.GOOGLE_CLIENT_SECRET,
						},
					}
				: {}),
			...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
				? {
						github: {
							clientId: env.GITHUB_CLIENT_ID,
							clientSecret: env.GITHUB_CLIENT_SECRET,
						},
					}
				: {}),
		},
	})
}
