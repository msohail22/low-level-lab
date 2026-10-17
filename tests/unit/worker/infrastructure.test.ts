// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// request-utils, the per-request database pool, the better-auth configuration, and ids.

const requirePermission = vi.fn()
vi.mock('../../../worker/authorization/openfga', () => ({ requirePermission }))

const pools: Array<{ options: unknown; end: ReturnType<typeof vi.fn> }> = []
vi.mock('pg', () => ({
	Pool: class {
		options: unknown
		end = vi.fn(async () => {})
		constructor(options: unknown) {
			this.options = options
			pools.push(this)
		}
	},
}))
const drizzle = vi.fn((pool: unknown, config: unknown) => ({ pool, config }))
vi.mock('drizzle-orm/node-postgres', () => ({ drizzle }))

const betterAuth = vi.fn((config: unknown) => ({ config }))
vi.mock('better-auth', () => ({ betterAuth }))
vi.mock('@better-auth/drizzle-adapter', () => ({ drizzleAdapter: vi.fn(() => 'adapter') }))

const utils = await import('../../../worker/controllers/request-utils')
const { createDatabase, closeDatabases } = await import('../../../worker/db/client')
const { createAuth } = await import('../../../worker/auth')
const { createId } = await import('../../../worker/lib/ids')
const { topicInputSchema } = await import('../../../types')

beforeEach(async () => {
	await closeDatabases()
	pools.length = 0
	vi.clearAllMocks()
})

describe('jsonResponse', () => {
	it('defaults to 200 with a JSON content type', async () => {
		const response = utils.jsonResponse({ a: 1 })
		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toContain('application/json')
		await expect(response.json()).resolves.toEqual({ a: 1 })
	})

	it.each([201, 400, 403, 404, 409, 500, 503])('uses status %i', (status) => {
		expect(utils.jsonResponse({}, status).status).toBe(status)
	})
})

describe('permission wrappers', () => {
	const request = new Request('https://lab.example')
	const env = {} as never

	it('requireContentManager checks manage_topics', async () => {
		requirePermission.mockResolvedValue({ id: 'u' })
		await expect(utils.requireContentManager(request, env)).resolves.toEqual({ id: 'u' })
		expect(requirePermission).toHaveBeenCalledWith(request, env, 'manage_topics')
	})

	it('requirePermissionFor forwards the permission and topic', async () => {
		requirePermission.mockResolvedValue(null)
		await expect(utils.requirePermissionFor(request, env, 'review_question', 'caches')).resolves.toBeNull()
		expect(requirePermission).toHaveBeenCalledWith(request, env, 'review_question', 'caches')
	})
})

describe('parseBody', () => {
	function post(body: string) {
		return new Request('https://lab.example', { method: 'POST', body })
	}

	it('returns the parsed data', async () => {
		await expect(utils.parseBody(post('{"name":"Caches","slug":"caches"}'), topicInputSchema)).resolves.toEqual({ data: { name: 'Caches', slug: 'caches' } })
	})

	it('trims strings through the schema', async () => {
		const result = await utils.parseBody(post('{"name":"  Caches  ","slug":"caches"}'), topicInputSchema)
		expect(result).toEqual({ data: { name: 'Caches', slug: 'caches' } })
	})

	it('drops unknown keys', async () => {
		const result = await utils.parseBody(post('{"name":"C","slug":"c","admin":true}'), topicInputSchema)
		expect(result).toEqual({ data: { name: 'C', slug: 'c' } })
	})

	it('returns a 400 response with issues for invalid data', async () => {
		const result = await utils.parseBody(post('{"name":""}'), topicInputSchema)
		expect('error' in result).toBe(true)
		const response = (result as { error: Response }).error
		expect(response.status).toBe(400)
		const body = await response.json()
		expect(body.error).toBe('Invalid request')
		expect(body.issues).toBeDefined()
	})

	it.each(['{bad', '', 'undefined'])('rejects the non-JSON body %j', async (body) => {
		await expect(utils.parseBody(post(body), topicInputSchema)).rejects.toThrow()
	})

	it.each(['null', '[]', '"string"', '42'])('400s the JSON value %s', async (body) => {
		const result = await utils.parseBody(post(body), topicInputSchema)
		expect('error' in result).toBe(true)
	})
})

describe('database client', () => {
	it('prefers DATABASE_URL over Hyperdrive', () => {
		createDatabase({ DATABASE_URL: 'postgres://direct', LOW_LEVEL_LAB_DB: { connectionString: 'postgres://hyper' } } as never)
		expect(pools[0].options).toEqual({ connectionString: 'postgres://direct', max: 1 })
	})

	it('falls back to the Hyperdrive connection string', () => {
		createDatabase({ LOW_LEVEL_LAB_DB: { connectionString: 'postgres://hyper' } } as never)
		expect(pools[0].options).toEqual({ connectionString: 'postgres://hyper', max: 1 })
	})

	it('merges the auth and content schemas into one client', () => {
		createDatabase({ DATABASE_URL: 'x' } as never)
		const schema = (drizzle.mock.calls[0][1] as { schema: Record<string, unknown> }).schema
		for (const table of ['user', 'session', 'account', 'verification', 'topic', 'question']) {
			expect(schema).toHaveProperty(table)
		}
	})

	it('opens a new pool per call and never reuses one', () => {
		createDatabase({ DATABASE_URL: 'x' } as never)
		createDatabase({ DATABASE_URL: 'x' } as never)
		expect(pools).toHaveLength(2)
		expect(pools[0]).not.toBe(pools[1])
	})

	it('closes every pool opened during the request', async () => {
		createDatabase({ DATABASE_URL: 'x' } as never)
		createDatabase({ DATABASE_URL: 'x' } as never)
		await closeDatabases()
		expect(pools.every((pool) => pool.end.mock.calls.length === 1)).toBe(true)
	})

	it('closes each pool only once', async () => {
		createDatabase({ DATABASE_URL: 'x' } as never)
		await closeDatabases()
		await closeDatabases()
		expect(pools[0].end).toHaveBeenCalledTimes(1)
	})

	it('still closes the others when one pool fails to close', async () => {
		createDatabase({ DATABASE_URL: 'x' } as never)
		createDatabase({ DATABASE_URL: 'x' } as never)
		pools[0].end.mockRejectedValue(new Error('already closed'))
		await expect(closeDatabases()).resolves.toBeUndefined()
		expect(pools[1].end).toHaveBeenCalled()
	})

	it('is a no-op with nothing open', async () => {
		await expect(closeDatabases()).resolves.toBeUndefined()
	})
})

describe('better-auth configuration', () => {
	type Config = {
		baseURL: string
		secret: string
		emailAndPassword: { enabled: boolean; requireEmailVerification: boolean; sendResetPassword: (a: unknown) => Promise<void> }
		emailVerification: { sendVerificationEmail: (a: unknown) => Promise<void> }
		socialProviders: Record<string, unknown>
	}
	const queue = { send: vi.fn() }
	const base = { DATABASE_URL: 'x', BETTER_AUTH_SECRET: 's3cret', LOW_LEVEL_LAB_QUEUE: queue }

	function configFor(env: Record<string, unknown>, url = 'https://lab.example/api/auth/x') {
		createAuth({ ...base, ...env } as never, new Request(url))
		return betterAuth.mock.calls.at(-1)![0] as Config
	}

	it('uses BETTER_AUTH_URL when set', () => {
		expect(configFor({ BETTER_AUTH_URL: 'https://canonical.example' }).baseURL).toBe('https://canonical.example')
	})

	it('falls back to the request origin', () => {
		expect(configFor({}, 'http://localhost:5173/api/auth/x').baseURL).toBe('http://localhost:5173')
	})

	it('passes the secret through', () => {
		expect(configFor({}).secret).toBe('s3cret')
	})

	it('requires email verification for password sign-in', () => {
		expect(configFor({}).emailAndPassword).toMatchObject({ enabled: true, requireEmailVerification: true })
	})

	it('queues password reset emails rather than sending inline', async () => {
		await configFor({}).emailAndPassword.sendResetPassword({ user: { email: 'a@b.c' }, url: 'https://r' })
		expect(queue.send).toHaveBeenCalledWith({ type: 'password-reset', to: 'a@b.c', url: 'https://r' })
	})

	it('queues verification emails', async () => {
		await configFor({}).emailVerification.sendVerificationEmail({ user: { email: 'a@b.c' }, url: 'https://v' })
		expect(queue.send).toHaveBeenCalledWith({ type: 'email-verification', to: 'a@b.c', url: 'https://v' })
	})

	it.each([
		['no providers', {}, []],
		['Google only', { GOOGLE_CLIENT_ID: 'g', GOOGLE_CLIENT_SECRET: 'gs' }, ['google']],
		['GitHub only', { GITHUB_CLIENT_ID: 'h', GITHUB_CLIENT_SECRET: 'hs' }, ['github']],
		['both', { GOOGLE_CLIENT_ID: 'g', GOOGLE_CLIENT_SECRET: 'gs', GITHUB_CLIENT_ID: 'h', GITHUB_CLIENT_SECRET: 'hs' }, ['google', 'github']],
		['Google id without secret', { GOOGLE_CLIENT_ID: 'g' }, []],
		['GitHub secret without id', { GITHUB_CLIENT_SECRET: 'hs' }, []],
	])('registers social providers: %s', (_label, env, providers) => {
		expect(Object.keys(configFor(env).socialProviders)).toEqual(providers)
	})
})

describe('createId', () => {
	it('returns a v4 UUID', () => {
		expect(createId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
	})

	it('does not repeat', () => {
		const ids = new Set(Array.from({ length: 1000 }, createId))
		expect(ids.size).toBe(1000)
	})
})
