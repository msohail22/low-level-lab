import { vi } from 'vitest'

import { createFakeOpenFga, FGA_ISSUER, FGA_URL } from './fake-openfga'
import { query } from './database'

/**
 * Drives the real Worker (worker/index.ts) with real Requests, against the PGlite database from
 * ./database and the fake OpenFGA from ./fake-openfga. Nothing between the fetch handler and the
 * SQL is mocked. Each test file must mock worker/db/client.ts onto the test database:
 *
 *   vi.mock('../../worker/db/client', async () => (await import('./database')).clientMock)
 *
 * See the top of any *.test.ts in this folder.
 */

export const BASE_URL = 'http://lab.test'
export const fga = createFakeOpenFga()
export const queue = { send: vi.fn(async (message: unknown) => { void message }) }

// Test-only values; none of them is a real credential.
export const env = {
	BETTER_AUTH_URL: BASE_URL,
	BETTER_AUTH_SECRET: 'integration-test-secret-integration-test-secret',
	LOW_LEVEL_LAB_QUEUE: queue,
	OPENFGA_API_URL: FGA_URL,
	OPENFGA_TOKEN_ISSUER: FGA_ISSUER,
	OPENFGA_STORE_ID: 'store',
	OPENFGA_MODEL_ID: 'model',
	OPENFGA_CLIENT_ID: 'client',
	OPENFGA_CLIENT_SECRET: 'client-secret',
	OPENFGA_AUDIENCE: FGA_URL,
	RESEND_API_KEY: 're_test',
	RESEND_FROM_EMAIL: 'lab@example.test',
} as Record<string, unknown>

/** Route outbound fetches: OpenFGA goes to the fake, anything else is a test failure. */
export function installFetch() {
	vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
		if (url.startsWith(FGA_URL) || url.startsWith(FGA_ISSUER)) return fga.handle(url, init)
		throw new Error(`Unexpected outbound fetch in an integration test: ${url}`)
	}))
}

async function worker() {
	return (await import('../../worker/index')).default
}

export type Reply = { status: number; body: any; headers: Headers } // eslint-disable-line @typescript-eslint/no-explicit-any

export async function call(method: string, path: string, options: { body?: unknown; cookie?: string; rawBody?: string } = {}): Promise<Reply> {
	const headers = new Headers({ origin: BASE_URL })
	if (options.cookie) headers.set('cookie', options.cookie)
	if (options.body !== undefined || options.rawBody !== undefined) headers.set('content-type', 'application/json')
	const request = new Request(new URL(path, BASE_URL), {
		method,
		headers,
		body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
		redirect: 'manual',
	})
	const handler = await worker()
	const response = await handler.fetch!(request as never, env as never, { waitUntil: () => {}, passThroughOnException: () => {}, props: {} } as never)
	const text = await response.text()
	let body: unknown = text
	try { body = text ? JSON.parse(text) : null } catch { /* not JSON */ }
	return { status: response.status, body, headers: response.headers }
}

function cookieFrom(headers: Headers) {
	return headers.getSetCookie().map((line) => line.split(';')[0]).join('; ')
}

export type Account = { id: string; email: string; name: string; cookie: string }

/** The last verification link the Worker queued for this address. */
export function verificationUrlFor(email: string) {
	const sent = queue.send.mock.calls.map(([message]) => message as { type: string; to: string; url: string })
	const message = sent.filter((item) => item.type === 'email-verification' && item.to === email).at(-1)
	if (!message) throw new Error(`No verification email queued for ${email}`)
	return message.url
}

/** Sign up, follow the queued verification link, then sign in — the same path a person takes. */
export async function register(name: string, email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.test`, password = 'correct horse battery'): Promise<Account> {
	const signUp = await call('POST', '/api/auth/sign-up/email', { body: { name, email, password } })
	if (signUp.status !== 200) throw new Error(`sign-up failed: ${signUp.status} ${JSON.stringify(signUp.body)}`)
	const verify = new URL(verificationUrlFor(email))
	const verified = await call('GET', verify.pathname + verify.search)
	if (verified.status >= 400) throw new Error(`verification failed: ${verified.status}`)
	const signIn = await call('POST', '/api/auth/sign-in/email', { body: { email, password } })
	if (signIn.status !== 200) throw new Error(`sign-in failed: ${signIn.status} ${JSON.stringify(signIn.body)}`)
	return { id: signIn.body.user.id, email, name, cookie: cookieFrom(signIn.headers) }
}

export { cookieFrom }

/** A topic created straight in the database, for tests that are not about topic management. */
export async function seedTopic(id = 'caches', name = 'Caches') {
	await query('INSERT INTO topic (id, slug, name) VALUES ($1, $2, $3)', [id, id, name])
	fga.linkTopic(id)
	return id
}

export const validQuestion = (overrides: Record<string, unknown> = {}) => ({
	title: 'Why does a linked list miss cache?',
	slug: 'linked-list-cache-miss',
	body: 'Think about what the prefetcher can see.',
	type: 'single_choice',
	topicId: 'caches',
	difficulty: 'intermediate',
	options: ['Pointer chasing defeats the prefetcher', 'Linked lists are shorter'],
	correctAnswer: 'Pointer chasing defeats the prefetcher',
	explanation: 'Each node address is only known after the previous load completes.',
	...overrides,
})

/**
 * Create a question through the API and walk it to published, as a super admin. Links the
 * question in the fake OpenFGA first, since the app itself never writes those tuples.
 */
export async function publishQuestion(admin: Account, overrides: Record<string, unknown> = {}) {
	const created = await call('POST', '/api/questions', { cookie: admin.cookie, body: validQuestion(overrides) })
	if (created.status !== 201) throw new Error(`create failed: ${created.status} ${JSON.stringify(created.body)}`)
	const id = created.body.id as string
	fga.linkQuestion(id, admin.id, created.body.topicId)
	for (const action of ['submit', 'start_review', 'approve', 'publish']) {
		const step = await call('POST', `/api/questions/${id}/${action}`, { cookie: admin.cookie, body: {} })
		if (step.status !== 200) throw new Error(`${action} failed: ${step.status} ${JSON.stringify(step.body)}`)
	}
	return id
}
