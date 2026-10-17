// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Every permission decision in the Worker goes through this module, so these tests pin the one
// property that matters most: any failure of any kind denies.

const getSession = vi.fn()
vi.mock('../../../worker/auth', () => ({
	createAuth: () => ({ api: { getSession } }),
}))

type OpenFga = typeof import('../../../worker/authorization/openfga')
let fga: OpenFga

const env = {
	OPENFGA_AUTH_MODE: undefined as string | undefined,
	OPENFGA_TOKEN_ISSUER: 'issuer.example.com',
	OPENFGA_CLIENT_ID: 'client-id',
	OPENFGA_CLIENT_SECRET: 'client-secret',
	OPENFGA_AUDIENCE: 'https://api.fga.example',
	OPENFGA_API_URL: 'https://api.fga.example',
	OPENFGA_STORE_ID: 'store-1',
	OPENFGA_MODEL_ID: 'model-1',
}

function asEnv(overrides: Partial<typeof env> = {}) {
	return { ...env, ...overrides } as never
}

const request = new Request('https://lab.example/api/anything', { headers: { cookie: 'session=abc' } })

const fetchMock = vi.fn()

function tokenResponse(token = 'tok-1', expiresIn: number | undefined = 3600) {
	return Response.json({ access_token: token, ...(expiresIn === undefined ? {} : { expires_in: expiresIn }) })
}

/** Route the stubbed fetch by URL so each test only describes what it cares about. */
function routeFetch(routes: { token?: () => Response; check?: () => Response; write?: () => Response; read?: () => Response }) {
	fetchMock.mockImplementation(async (url: string) => {
		if (url.endsWith('/oauth/token')) return (routes.token ?? (() => tokenResponse()))()
		if (url.endsWith('/check')) return (routes.check ?? (() => Response.json({ allowed: true })))()
		if (url.endsWith('/write')) return (routes.write ?? (() => Response.json({})))()
		if (url.endsWith('/read')) return (routes.read ?? (() => Response.json({ tuples: [] })))()
		throw new Error(`unexpected fetch ${url}`)
	})
}

function callsTo(suffix: string) {
	return fetchMock.mock.calls.filter(([url]) => String(url).endsWith(suffix))
}

function checkBody(index = 0) {
	return JSON.parse(callsTo('/check')[index][1].body)
}

beforeEach(async () => {
	vi.resetModules()
	fetchMock.mockReset()
	getSession.mockReset()
	vi.stubGlobal('fetch', fetchMock)
	getSession.mockResolvedValue({ user: { id: 'user-1', email: 'a@b.c' } })
	routeFetch({})
	fga = await import('../../../worker/authorization/openfga')
})

afterEach(() => {
	vi.unstubAllGlobals()
	vi.useRealTimers()
})

describe('permissions list', () => {
	it('names the eight permissions the model knows', () => {
		expect(fga.permissions).toEqual([
			'create_question', 'edit_question', 'submit_question', 'review_question',
			'approve_question', 'publish_question', 'manage_topics', 'manage_users',
		])
	})
})

describe('getAuthenticatedUser', () => {
	it('returns the session user', async () => {
		await expect(fga.getAuthenticatedUser(request, asEnv())).resolves.toEqual({ id: 'user-1', email: 'a@b.c' })
	})

	it('reads the session from the request headers', async () => {
		await fga.getAuthenticatedUser(request, asEnv())
		expect(getSession).toHaveBeenCalledWith({ headers: request.headers })
	})

	it.each([
		['no session', null],
		['a session with no user', {}],
		['undefined', undefined],
	])('returns null for %s', async (_label, session) => {
		getSession.mockResolvedValue(session)
		await expect(fga.getAuthenticatedUser(request, asEnv())).resolves.toBeNull()
	})

	it('returns null when the session lookup throws', async () => {
		getSession.mockRejectedValue(new Error('database down'))
		await expect(fga.getAuthenticatedUser(request, asEnv())).resolves.toBeNull()
	})
})

describe('requirePermission fails closed', () => {
	it('allows when OpenFGA says allowed', async () => {
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toMatchObject({ id: 'user-1' })
	})

	it('denies with no session and never calls OpenFGA', async () => {
		getSession.mockResolvedValue(null)
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toBeNull()
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('denies when OpenFGA says not allowed', async () => {
		routeFetch({ check: () => Response.json({ allowed: false }) })
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toBeNull()
	})

	it.each([
		['an empty body', {}],
		['allowed as a string', { allowed: 'true' }],
		['allowed null', { allowed: null }],
	])('treats %s as a deny unless it is truthy', async (_label, body) => {
		routeFetch({ check: () => Response.json(body) })
		const result = await fga.requirePermission(request, asEnv(), 'create_question')
		expect(result === null).toBe(!body.allowed)
	})

	it.each([400, 401, 403, 404, 500, 503])('denies when the check returns %i', async (status) => {
		routeFetch({ check: () => new Response('nope', { status }) })
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toBeNull()
	})

	it.each([400, 401, 500])('denies when the token request returns %i', async (status) => {
		routeFetch({ token: () => new Response('bad credentials', { status }) })
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toBeNull()
		expect(callsTo('/check')).toHaveLength(0)
	})

	it('denies when the token response has no access token', async () => {
		routeFetch({ token: () => Response.json({ expires_in: 60 }) })
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toBeNull()
	})

	it('denies when the network throws', async () => {
		fetchMock.mockRejectedValue(new TypeError('fetch failed'))
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toBeNull()
	})

	it('denies when the check body is not JSON', async () => {
		routeFetch({ check: () => new Response('<html>', { status: 200 }) })
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.toBeNull()
	})

	it('denies everything in local mode without touching the network', async () => {
		for (const permission of fga.permissions) {
			await expect(fga.requirePermission(request, asEnv({ OPENFGA_AUTH_MODE: 'local' }), permission)).resolves.toBeNull()
		}
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('only treats exactly "local" as local mode', async () => {
		await expect(fga.requirePermission(request, asEnv({ OPENFGA_AUTH_MODE: 'LOCAL' }), 'create_question')).resolves.not.toBeNull()
	})
})

describe('check request shape', () => {
	it('sends the user, bare relation, object and model id', async () => {
		await fga.requirePermission(request, asEnv(), 'create_question')
		expect(checkBody()).toEqual({
			user: 'user:user-1',
			relation: 'create_question',
			object: 'organization:low-level-lab',
			authorization_model_id: 'model-1',
		})
	})

	it('posts to the store check endpoint with a bearer token', async () => {
		await fga.requirePermission(request, asEnv(), 'create_question')
		const [url, init] = callsTo('/check')[0]
		expect(url).toBe('https://api.fga.example/stores/store-1/check')
		expect(init.method).toBe('POST')
		expect(init.headers.authorization).toBe('Bearer tok-1')
		expect(init.headers['content-type']).toBe('application/json')
	})
})

describe('which object a permission is checked against', () => {
	const questionScoped = ['edit_question', 'submit_question', 'review_question', 'approve_question', 'publish_question'] as const
	const topicScoped = ['manage_topics', 'review_question', 'approve_question'] as const

	it.each(questionScoped)('%s with a question id checks the question', async (permission) => {
		await fga.requirePermission(request, asEnv(), permission, 'topic-1', 'q-1')
		expect(checkBody().object).toBe('question:q-1')
	})

	it.each(['create_question', 'manage_topics', 'manage_users'] as const)('%s ignores a question id', async (permission) => {
		await fga.requirePermission(request, asEnv(), permission, undefined, 'q-1')
		expect(checkBody().object).toBe('organization:low-level-lab')
	})

	it.each(topicScoped)('%s with only a topic id checks the topic', async (permission) => {
		await fga.requirePermission(request, asEnv(), permission, 'topic-1')
		expect(checkBody().object).toBe('topic:topic-1')
	})

	it.each(['create_question', 'edit_question', 'submit_question', 'publish_question', 'manage_users'] as const)('%s ignores a topic id', async (permission) => {
		await fga.requirePermission(request, asEnv(), permission, 'topic-1')
		expect(checkBody().object).toBe('organization:low-level-lab')
	})

	it('falls back to the organization with neither id', async () => {
		await fga.requirePermission(request, asEnv(), 'review_question')
		expect(checkBody().object).toBe('organization:low-level-lab')
	})

	it('requireQuestionPermission passes both ids through', async () => {
		await fga.requireQuestionPermission(request, asEnv(), 'edit_question', { id: 'q-9', topicId: 't-9' })
		expect(checkBody().object).toBe('question:q-9')
	})

	it('requireQuestionPermission uses the topic for topic-only permissions', async () => {
		await fga.requireQuestionPermission(request, asEnv(), 'manage_topics', { id: 'q-9', topicId: 't-9' })
		expect(checkBody().object).toBe('topic:t-9')
	})
})

describe('access token', () => {
	it('uses the client-credentials grant against the issuer', async () => {
		await fga.requirePermission(request, asEnv(), 'create_question')
		const [url, init] = callsTo('/oauth/token')[0]
		expect(url).toBe('https://issuer.example.com/oauth/token')
		expect(init.headers['content-type']).toBe('application/x-www-form-urlencoded')
		const form = new URLSearchParams(init.body)
		expect(Object.fromEntries(form)).toEqual({
			grant_type: 'client_credentials',
			client_id: 'client-id',
			client_secret: 'client-secret',
			audience: 'https://api.fga.example',
		})
	})

	it.each([
		['https://issuer.example.com', 'https://issuer.example.com/oauth/token'],
		['http://localhost:8080', 'http://localhost:8080/oauth/token'],
		['issuer.example.com', 'https://issuer.example.com/oauth/token'],
	])('builds the token URL from issuer %s', async (issuer, expected) => {
		await fga.requirePermission(request, asEnv({ OPENFGA_TOKEN_ISSUER: issuer }), 'create_question')
		expect(callsTo('/oauth/token')[0][0]).toBe(expected)
	})

	it('reuses a cached token across checks', async () => {
		await fga.requirePermission(request, asEnv(), 'create_question')
		await fga.requirePermission(request, asEnv(), 'manage_users')
		await fga.requirePermission(request, asEnv(), 'manage_topics')
		expect(callsTo('/oauth/token')).toHaveLength(1)
		expect(callsTo('/check')).toHaveLength(3)
	})

	it('refreshes a token within 30 seconds of expiry', async () => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
		routeFetch({ token: () => tokenResponse('short', 60) })
		await fga.requirePermission(request, asEnv(), 'create_question')
		vi.setSystemTime(new Date('2026-01-01T00:00:29Z'))
		await fga.requirePermission(request, asEnv(), 'create_question')
		expect(callsTo('/oauth/token')).toHaveLength(1)
		vi.setSystemTime(new Date('2026-01-01T00:00:31Z'))
		await fga.requirePermission(request, asEnv(), 'create_question')
		expect(callsTo('/oauth/token')).toHaveLength(2)
	})

	it('assumes an hour when expires_in is missing', async () => {
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
		routeFetch({ token: () => tokenResponse('tok', undefined) })
		await fga.requirePermission(request, asEnv(), 'create_question')
		vi.setSystemTime(new Date('2026-01-01T00:59:00Z'))
		await fga.requirePermission(request, asEnv(), 'create_question')
		expect(callsTo('/oauth/token')).toHaveLength(1)
		vi.setSystemTime(new Date('2026-01-01T00:59:45Z'))
		await fga.requirePermission(request, asEnv(), 'create_question')
		expect(callsTo('/oauth/token')).toHaveLength(2)
	})

	it('does not cache a failed token request', async () => {
		routeFetch({ token: () => new Response('no', { status: 401 }) })
		await fga.requirePermission(request, asEnv(), 'create_question')
		routeFetch({})
		await expect(fga.requirePermission(request, asEnv(), 'create_question')).resolves.not.toBeNull()
		expect(callsTo('/oauth/token')).toHaveLength(2)
	})
})

describe('manageRoleTuple', () => {
	it('writes an organization-scoped role by default', async () => {
		const tuple = await fga.manageRoleTuple(asEnv(), { userId: 'u2', role: 'reviewer' }, 'add')
		expect(tuple).toEqual({ user: 'user:u2', relation: 'reviewer', object: 'organization:low-level-lab' })
		const body = JSON.parse(callsTo('/write')[0][1].body)
		expect(body).toEqual({ writes: { tuple_keys: [tuple] }, authorization_model_id: 'model-1' })
	})

	it('writes to a named organization', async () => {
		const tuple = await fga.manageRoleTuple(asEnv(), { userId: 'u2', role: 'admin', organizationId: 'acme' }, 'add')
		expect(tuple.object).toBe('organization:acme')
	})

	it('prefers the topic over the organization', async () => {
		const tuple = await fga.manageRoleTuple(asEnv(), { userId: 'u2', role: 'admin', organizationId: 'acme', topicId: 'caches' }, 'add')
		expect(tuple.object).toBe('topic:caches')
	})

	it('removes a tuple as a delete only', async () => {
		const tuple = await fga.manageRoleTuple(asEnv(), { userId: 'u2', role: 'member' }, 'remove')
		const body = JSON.parse(callsTo('/write')[0][1].body)
		expect(body).toEqual({ deletes: { tuple_keys: [tuple] }, authorization_model_id: 'model-1' })
	})

	it('posts to the store write endpoint', async () => {
		await fga.manageRoleTuple(asEnv(), { userId: 'u2', role: 'member' }, 'add')
		expect(callsTo('/write')[0][0]).toBe('https://api.fga.example/stores/store-1/write')
	})

	it('refuses to write in local mode', async () => {
		await expect(fga.manageRoleTuple(asEnv({ OPENFGA_AUTH_MODE: 'local' }), { userId: 'u2', role: 'member' }, 'add'))
			.rejects.toThrow('disabled in local authorization mode')
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('throws when the write fails', async () => {
		routeFetch({ write: () => new Response('bad', { status: 400 }) })
		await expect(fga.manageRoleTuple(asEnv(), { userId: 'u2', role: 'member' }, 'add')).rejects.toThrow('status 400')
	})
})

describe('listRoleTuples', () => {
	it('reads tuples for the default organization', async () => {
		const tuples = [{ user: 'user:u1', relation: 'admin', object: 'organization:low-level-lab' }]
		routeFetch({ read: () => Response.json({ tuples }) })
		await expect(fga.listRoleTuples(asEnv())).resolves.toEqual(tuples)
		expect(JSON.parse(callsTo('/read')[0][1].body)).toEqual({ tuple_key: { object: 'organization:low-level-lab' } })
	})

	it('reads a named organization', async () => {
		await fga.listRoleTuples(asEnv(), 'acme')
		expect(JSON.parse(callsTo('/read')[0][1].body)).toEqual({ tuple_key: { object: 'organization:acme' } })
	})

	it('returns an empty list when the response has no tuples', async () => {
		routeFetch({ read: () => Response.json({}) })
		await expect(fga.listRoleTuples(asEnv())).resolves.toEqual([])
	})

	it('returns an empty list in local mode', async () => {
		await expect(fga.listRoleTuples(asEnv({ OPENFGA_AUTH_MODE: 'local' }))).resolves.toEqual([])
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('throws when the read fails', async () => {
		routeFetch({ read: () => new Response('bad', { status: 500 }) })
		await expect(fga.listRoleTuples(asEnv())).rejects.toThrow('status 500')
	})
})
