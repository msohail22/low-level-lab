/**
 * Seed a super admin.
 *
 * Two independent steps, because they can fail independently:
 *   1. Create the account in Postgres through better-auth, so the password
 *      hash matches what the Worker will verify at sign-in.
 *   2. Write the `super_admin` OpenFGA tuple that actually grants the role.
 *
 * Nothing here is committed with a value in it. Everything comes from the
 * environment:
 *
 *   DATABASE_URL, BETTER_AUTH_SECRET            (required, step 1)
 *   SEED_EMAIL, SEED_PASSWORD, SEED_NAME        (required, step 1)
 *   OPENFGA_* as in .dev.vars                   (required, step 2)
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

const ORGANIZATION = 'low-level-lab'

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

async function grantSuperAdmin(userId: string) {
	const issuer = required('OPENFGA_TOKEN_ISSUER').startsWith('http')
		? required('OPENFGA_TOKEN_ISSUER')
		: `https://${required('OPENFGA_TOKEN_ISSUER')}`

	const tokenResponse = await fetch(`${issuer}/oauth/token`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: required('OPENFGA_CLIENT_ID'),
			client_secret: required('OPENFGA_CLIENT_SECRET'),
			audience: required('OPENFGA_AUDIENCE'),
		}),
	})
	if (!tokenResponse.ok) {
		throw new Error(`OpenFGA token request failed (${tokenResponse.status}). Check OPENFGA_CLIENT_ID and OPENFGA_CLIENT_SECRET.`)
	}
	const { access_token } = (await tokenResponse.json()) as { access_token: string }

	const writeResponse = await fetch(
		`${required('OPENFGA_API_URL')}/stores/${required('OPENFGA_STORE_ID')}/write`,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${access_token}` },
			body: JSON.stringify({
				writes: {
					tuple_keys: [
						{ user: `user:${userId}`, relation: 'super_admin', object: `organization:${ORGANIZATION}` },
					],
				},
				authorization_model_id: required('OPENFGA_MODEL_ID'),
			}),
		},
	)
	if (!writeResponse.ok) {
		throw new Error(`OpenFGA tuple write failed (${writeResponse.status}): ${(await writeResponse.text()).slice(0, 200)}`)
	}
	console.log(`Granted super_admin on organization:${ORGANIZATION} to user:${userId}`)
}

const userId = await createAccount()

if (process.env.OPENFGA_AUTH_MODE === 'local') {
	console.log('\nOPENFGA_AUTH_MODE=local: skipping the tuple write.')
	console.log('Local mode denies every permission check, so this account has no elevated rights yet.')
	console.log('Set OPENFGA_AUTH_MODE=cloud with working credentials, then re-run to grant the role.')
} else {
	await grantSuperAdmin(userId)
}
