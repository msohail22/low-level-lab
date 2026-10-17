// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { query, resetDatabase, startDatabase, stopDatabase } from './database'
import { call, cookieFrom, fga, installFetch, queue, register, verificationUrlFor } from './harness'

// Real better-auth, real Postgres: sign-up, the queued verification email, sign-in, sessions.

vi.mock('../../worker/db/client', async () => (await import('./database')).clientMock)

beforeAll(startDatabase)
afterAll(stopDatabase)
beforeEach(async () => {
	await resetDatabase()
	fga.reset()
	queue.send.mockClear()
	installFetch()
})

const credentials = { name: 'Ada Lovelace', email: 'ada@example.test', password: 'correct horse battery' }

describe('sign-up', () => {
	it('creates an unverified user and stores only a password hash', async () => {
		const reply = await call('POST', '/api/auth/sign-up/email', { body: credentials })
		expect(reply.status).toBe(200)
		const [row] = await query<{ email: string; email_verified: boolean }>('SELECT email, email_verified FROM "user"')
		expect(row).toEqual({ email: 'ada@example.test', email_verified: false })
		const [account] = await query<{ password: string }>('SELECT password FROM account')
		expect(account.password).toBeTruthy()
		expect(account.password).not.toContain('correct horse battery')
	})

	it('queues a verification email instead of sending it inline', async () => {
		await call('POST', '/api/auth/sign-up/email', { body: credentials })
		expect(queue.send).toHaveBeenCalledTimes(1)
		const message = queue.send.mock.calls[0][0] as { type: string; to: string; url: string }
		expect(message.type).toBe('email-verification')
		expect(message.to).toBe('ada@example.test')
		expect(message.url).toMatch(/^http:\/\/lab\.test\/api\/auth\/verify-email\?token=/)
	})

	it('does not issue a session before the email is verified', async () => {
		const reply = await call('POST', '/api/auth/sign-up/email', { body: credentials })
		expect(cookieFrom(reply.headers)).not.toContain('session_token')
	})

	// With verification required, better-auth answers a duplicate sign-up exactly like a new one so
	// the endpoint cannot be used to discover which addresses have accounts.
	it('does not create a second account or reveal that the email is taken', async () => {
		const first = await call('POST', '/api/auth/sign-up/email', { body: credentials })
		const again = await call('POST', '/api/auth/sign-up/email', { body: credentials })
		expect(again.status).toBe(first.status)
		expect(await query('SELECT id FROM "user"')).toHaveLength(1)
	})

	it.each([
		['a short password', { ...credentials, password: 'short' }],
		['a malformed email', { ...credentials, email: 'not-an-email' }],
	])('refuses %s', async (_label, body) => {
		const reply = await call('POST', '/api/auth/sign-up/email', { body })
		expect(reply.status).toBeGreaterThanOrEqual(400)
		expect(await query('SELECT id FROM "user"')).toHaveLength(0)
	})
})

describe('sign-in', () => {
	it('refuses an unverified account', async () => {
		await call('POST', '/api/auth/sign-up/email', { body: credentials })
		const reply = await call('POST', '/api/auth/sign-in/email', { body: { email: credentials.email, password: credentials.password } })
		expect(reply.status).toBe(403)
		expect(cookieFrom(reply.headers)).not.toContain('session_token')
	})

	it('works after following the verification link', async () => {
		await call('POST', '/api/auth/sign-up/email', { body: credentials })
		const link = new URL(verificationUrlFor(credentials.email))
		await call('GET', link.pathname + link.search)
		const [row] = await query<{ email_verified: boolean }>('SELECT email_verified FROM "user"')
		expect(row.email_verified).toBe(true)
		const reply = await call('POST', '/api/auth/sign-in/email', { body: { email: credentials.email, password: credentials.password } })
		expect(reply.status).toBe(200)
		expect(cookieFrom(reply.headers)).toContain('session_token')
	})

	it('sets the session cookie httpOnly', async () => {
		await call('POST', '/api/auth/sign-up/email', { body: credentials })
		const link = new URL(verificationUrlFor(credentials.email))
		await call('GET', link.pathname + link.search)
		const reply = await call('POST', '/api/auth/sign-in/email', { body: { email: credentials.email, password: credentials.password } })
		const sessionCookie = reply.headers.getSetCookie().find((line) => line.includes('session_token'))
		expect(sessionCookie).toMatch(/HttpOnly/i)
	})

	it('refuses a wrong password', async () => {
		await register('Ada Lovelace', credentials.email)
		const reply = await call('POST', '/api/auth/sign-in/email', { body: { email: credentials.email, password: 'wrong password!!' } })
		expect(reply.status).toBe(401)
	})

	it('refuses an unknown email with the same status as a wrong password', async () => {
		const reply = await call('POST', '/api/auth/sign-in/email', { body: { email: 'nobody@example.test', password: 'whatever12345' } })
		expect(reply.status).toBe(401)
	})

	it('refuses a tampered verification token', async () => {
		await call('POST', '/api/auth/sign-up/email', { body: credentials })
		const reply = await call('GET', '/api/auth/verify-email?token=forged.token.value')
		expect(reply.status === 302 ? reply.headers.get('location') : String(reply.status)).toMatch(/error|40\d/i)
		const [row] = await query<{ email_verified: boolean }>('SELECT email_verified FROM "user"')
		expect(row.email_verified).toBe(false)
	})
})

describe('session', () => {
	it('returns the signed-in user', async () => {
		const ada = await register('Ada Lovelace')
		const reply = await call('GET', '/api/auth/get-session', { cookie: ada.cookie })
		expect(reply.status).toBe(200)
		expect(reply.body.user).toMatchObject({ id: ada.id, email: ada.email, name: 'Ada Lovelace' })
	})

	it('returns no session without a cookie', async () => {
		const reply = await call('GET', '/api/auth/get-session')
		expect(reply.body).toBeNull()
	})

	it('returns no session for a forged cookie', async () => {
		const reply = await call('GET', '/api/auth/get-session', { cookie: 'better-auth.session_token=forged' })
		expect(reply.body).toBeNull()
	})

	it('ends the session on sign-out', async () => {
		const ada = await register('Ada Lovelace')
		const out = await call('POST', '/api/auth/sign-out', { cookie: ada.cookie, body: {} })
		expect(out.status).toBe(200)
		const after = await call('GET', '/api/auth/get-session', { cookie: ada.cookie })
		expect(after.body).toBeNull()
		expect(await query('SELECT id FROM session')).toHaveLength(0)
	})

	it('keeps two users apart', async () => {
		const ada = await register('Ada Lovelace')
		const grace = await register('Grace Hopper')
		expect((await call('GET', '/api/auth/get-session', { cookie: ada.cookie })).body.user.id).toBe(ada.id)
		expect((await call('GET', '/api/auth/get-session', { cookie: grace.cookie })).body.user.id).toBe(grace.id)
	})
})

describe('password reset', () => {
	it('queues a reset email for a known address', async () => {
		await register('Ada Lovelace', credentials.email)
		queue.send.mockClear()
		const reply = await call('POST', '/api/auth/request-password-reset', { body: { email: credentials.email, redirectTo: '/reset-password' } })
		expect(reply.status).toBe(200)
		expect(queue.send).toHaveBeenCalledWith(expect.objectContaining({ type: 'password-reset', to: credentials.email }))
	})

	it('answers the same for an unknown address and queues nothing', async () => {
		const reply = await call('POST', '/api/auth/request-password-reset', { body: { email: 'nobody@example.test', redirectTo: '/reset-password' } })
		expect(reply.status).toBe(200)
		expect(queue.send).not.toHaveBeenCalled()
	})

	it('changes the password through the emailed token', async () => {
		await register('Ada Lovelace', credentials.email)
		queue.send.mockClear()
		await call('POST', '/api/auth/request-password-reset', { body: { email: credentials.email, redirectTo: '/reset-password' } })
		const link = new URL((queue.send.mock.calls[0][0] as { url: string }).url)
		const reset = await call('GET', link.pathname + link.search)
		const token = new URL(reset.headers.get('location')!, 'http://lab.test').searchParams.get('token')
		expect(token).toBeTruthy()
		const changed = await call('POST', '/api/auth/reset-password', { body: { newPassword: 'a brand new password', token } })
		expect(changed.status).toBe(200)
		expect((await call('POST', '/api/auth/sign-in/email', { body: { email: credentials.email, password: credentials.password } })).status).toBe(401)
		expect((await call('POST', '/api/auth/sign-in/email', { body: { email: credentials.email, password: 'a brand new password' } })).status).toBe(200)
	})
})
