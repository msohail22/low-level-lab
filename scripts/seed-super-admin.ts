/**
 * Seed a super admin.
 *
 * Creates the account in Postgres through better-auth, so the password hash
 * matches what the Worker will verify at sign-in, and marks the address
 * verified. No role is granted: authorization is session-only for now, so any
 * signed-in account already has full access.
 *
 * Nothing here is committed with a value in it. Everything comes from the
 * environment:
 *
 *   DATABASE_URL, BETTER_AUTH_SECRET            (required)
 *   SEED_EMAIL, SEED_PASSWORD, SEED_NAME        (required)
 *
 * Run:
 *   node --env-file=.dev.vars --env-file-if-exists=.seed.vars scripts/seed-super-admin.ts
 */
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import { Pool } from 'pg'

import { authSchema, user } from '../worker/db/auth-schema.js'
import { contentSchema } from '../worker/db/content-schema.js'

function required(name: string) {
	const value = process.env[name]
	if (!value) throw new Error(`${name} is required`)
	return value
}

async function createAccount() {
	const pool = new Pool({ connectionString: required('DATABASE_URL'), max: 1 })
	const db = drizzle(pool, { schema: { ...authSchema, ...contentSchema } })

	const auth = betterAuth({
		baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
		secret: required('BETTER_AUTH_SECRET'),
		database: drizzleAdapter(db, { provider: 'pg' }),
		// No email hooks: this runs outside the Worker, so there is no queue
		// binding to send through. The account is marked verified below.
		emailAndPassword: { enabled: true, requireEmailVerification: false },
	})

	const email = required('SEED_EMAIL')
	const existing = await db.select().from(user).where(eq(user.email, email))
	if (existing.length > 0) {
		console.log(`Account already exists: ${email} (id ${existing[0].id})`)
		await pool.end()
		return existing[0].id
	}

	await auth.api.signUpEmail({
		body: { email, password: required('SEED_PASSWORD'), name: required('SEED_NAME') },
	})

	// Sign-in requires a verified address, and there is no inbox in a seed run.
	await db.update(user).set({ emailVerified: true }).where(eq(user.email, email))

	const [created] = await db.select().from(user).where(eq(user.email, email))
	console.log(`Created account: ${email} (id ${created.id}), email marked verified`)
	await pool.end()
	return created.id
}

await createAccount()

console.log('\nAuthorization is session-only right now, so this account can already do everything.')
console.log('No role has to be granted until a real permission system is wired back in.')
