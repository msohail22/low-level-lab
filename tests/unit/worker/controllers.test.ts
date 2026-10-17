// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The smaller controllers: topics, moderation, progress, roles, social publish, and the execution
// placeholder. The question controller has its own file.

const questionSvc = { get: vi.fn(), list: vi.fn(), progress: vi.fn(), history: vi.fn(), topicCounts: vi.fn() }
const topicSvc = { get: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), archive: vi.fn() }
const auth = {
	requirePermission: vi.fn(),
	requireQuestionPermission: vi.fn(),
	getAuthenticatedUser: vi.fn(),
	manageRoleTuple: vi.fn(),
	listRoleTuples: vi.fn(),
}

vi.mock('../../../worker/db/client', () => ({ createDatabase: () => ({}) }))
vi.mock('../../../worker/services/question-service', () => ({ createQuestionService: () => questionSvc }))
vi.mock('../../../worker/services/topic-service', () => ({ createTopicService: () => topicSvc }))
vi.mock('../../../worker/authorization/openfga', () => auth)

const { handleTopicRequest } = await import('../../../worker/controllers/topic-controller')
const { handleModerationRequest } = await import('../../../worker/controllers/moderation-controller')
const { handleProgressRequest } = await import('../../../worker/controllers/progress-controller')
const { handleAuthorizationRequest } = await import('../../../worker/controllers/authorization-controller')
const { handleSocialPublish } = await import('../../../worker/controllers/social-controller')
const { codingExecutionPlaceholder } = await import('../../../worker/controllers/placeholder-controller')

const env = { SOCIAL_PUBLISH_WEBHOOK_URL: 'https://hooks.example/publish' }
const user = { id: 'user-1' }

function req(method: string, path: string, body?: unknown) {
	return new Request(new URL(path, 'https://lab.example'), {
		method,
		...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
	})
}

async function read(response: Response) {
	return { status: response.status, body: await response.json() }
}

beforeEach(() => {
	vi.clearAllMocks()
	for (const fn of Object.values(auth)) fn.mockResolvedValue(null)
})

afterEach(() => vi.unstubAllGlobals())

describe('topics', () => {
	const topic = { id: 'caches', name: 'Caches', slug: 'caches', total: 2, solved: 1 }

	it('lists topics for anyone', async () => {
		topicSvc.list.mockResolvedValue([topic])
		const { status, body } = await read(await handleTopicRequest(req('GET', '/api/topics'), env as never))
		expect(status).toBe(200)
		expect(body).toEqual([topic])
		expect(topicSvc.list).toHaveBeenCalledWith(undefined)
	})

	it('scopes the listing to the signed-in user', async () => {
		auth.getAuthenticatedUser.mockResolvedValue(user)
		topicSvc.list.mockResolvedValue([])
		await handleTopicRequest(req('GET', '/api/topics'), env as never)
		expect(topicSvc.list).toHaveBeenCalledWith('user-1')
	})

	it('404s an unknown topic', async () => {
		topicSvc.get.mockResolvedValue(null)
		expect((await handleTopicRequest(req('GET', '/api/topics/nope'), env as never, 'nope')).status).toBe(404)
	})

	it('strips the answer key from every question in a topic', async () => {
		topicSvc.get.mockResolvedValue({ ...topic, questions: [{ id: 'q1', title: 'T', correctAnswer: 'x', authorId: 'a' }] })
		const { body } = await read(await handleTopicRequest(req('GET', '/api/topics/caches'), env as never, 'caches'))
		expect(body.questions).toEqual([{ id: 'q1', title: 'T' }])
		expect(JSON.stringify(body)).not.toContain('correctAnswer')
	})

	it.each([
		['', 1, 20],
		['?page=3&pageSize=10', 3, 10],
		['?page=0', 1, 20],
		['?page=-5', 1, 20],
		['?pageSize=0', 1, 1],
		['?pageSize=500', 1, 50],
		['?pageSize=-1', 1, 1],
	])('clamps paging %s to page %i size %i', async (query, page, pageSize) => {
		topicSvc.get.mockResolvedValue({ ...topic, questions: [] })
		await handleTopicRequest(req('GET', `/api/topics/caches${query}`), env as never, 'caches')
		expect(topicSvc.get).toHaveBeenCalledWith('caches', undefined, page, pageSize)
	})

	// Pinned current behaviour: a non-numeric page is NaN, and Math.max(1, NaN) is NaN, so it slips
	// past the clamp into the service. Worth validating with a Zod schema like the questions route.
	it('passes NaN through for a non-numeric page', async () => {
		topicSvc.get.mockResolvedValue({ ...topic, questions: [] })
		await handleTopicRequest(req('GET', '/api/topics/caches?page=abc'), env as never, 'caches')
		expect(topicSvc.get.mock.calls[0][2]).toBeNaN()
	})

	it.each([
		['POST', undefined],
		['PUT', 'caches'],
		['DELETE', 'caches'],
	])('%s requires manage_topics', async (method, id) => {
		const response = await handleTopicRequest(req(method, '/api/topics', { name: 'X', slug: 'x' }), env as never, id)
		expect(response.status).toBe(403)
		expect(auth.requirePermission).toHaveBeenCalledWith(expect.any(Request), env, 'manage_topics', id)
		expect(topicSvc.create).not.toHaveBeenCalled()
		expect(topicSvc.update).not.toHaveBeenCalled()
		expect(topicSvc.archive).not.toHaveBeenCalled()
	})

	describe('as a content manager', () => {
		beforeEach(() => auth.requirePermission.mockResolvedValue(user))

		it('creates a topic with 201', async () => {
			topicSvc.create.mockResolvedValue([{ id: 'new' }])
			const { status, body } = await read(await handleTopicRequest(req('POST', '/api/topics', { name: 'Networking', slug: 'networking' }), env as never))
			expect(status).toBe(201)
			expect(body).toEqual({ id: 'new' })
		})

		it.each([
			['blank name', { name: ' ', slug: 'x' }],
			['bad slug', { name: 'X', slug: 'Has Spaces' }],
			['trailing hyphen', { name: 'X', slug: 'x-' }],
			['name too long', { name: 'x'.repeat(121), slug: 'x' }],
			['description too long', { name: 'X', slug: 'x', description: 'd'.repeat(501) }],
		])('400s a %s', async (_label, body) => {
			expect((await handleTopicRequest(req('POST', '/api/topics', body), env as never)).status).toBe(400)
			expect(topicSvc.create).not.toHaveBeenCalled()
		})

		it('updates a topic', async () => {
			topicSvc.update.mockResolvedValue([{ id: 'caches', name: 'New' }])
			const response = await handleTopicRequest(req('PUT', '/api/topics/caches', { name: 'New', slug: 'caches' }), env as never, 'caches')
			expect(response.status).toBe(200)
			expect(topicSvc.update).toHaveBeenCalledWith('caches', { name: 'New', slug: 'caches' })
		})

		it('404s an update that matched nothing', async () => {
			topicSvc.update.mockResolvedValue([])
			expect((await handleTopicRequest(req('PUT', '/api/topics/x', { name: 'N', slug: 'x' }), env as never, 'x')).status).toBe(404)
		})

		it('archives a topic', async () => {
			topicSvc.archive.mockResolvedValue([{ id: 'caches' }])
			expect((await handleTopicRequest(req('DELETE', '/api/topics/caches'), env as never, 'caches')).status).toBe(200)
		})

		it('404s an archive that matched nothing', async () => {
			topicSvc.archive.mockResolvedValue([])
			expect((await handleTopicRequest(req('DELETE', '/api/topics/x'), env as never, 'x')).status).toBe(404)
		})

		it.each([
			['POST to an item', 'POST', 'caches'],
			['PUT on the collection', 'PUT', undefined],
			['DELETE on the collection', 'DELETE', undefined],
			['PATCH', 'PATCH', 'caches'],
		])('405s %s', async (_label, method, id) => {
			expect((await handleTopicRequest(req(method, '/api/topics', {}), env as never, id)).status).toBe(405)
		})
	})
})

describe('moderation queues', () => {
	it('405s anything but GET', async () => {
		expect((await handleModerationRequest(req('POST', '/api/moderation/reviewer'), env as never)).status).toBe(405)
		expect(auth.requirePermission).not.toHaveBeenCalled()
	})

	it.each([
		['/api/moderation/reviewer', 'review_question'],
		['/api/moderation', 'review_question'],
		['/api/moderation?queue=admin', 'approve_question'],
		['/api/moderation/admin', 'approve_question'],
		['/api/moderation/anything', 'review_question'],
	])('%s needs %s', async (path, permission) => {
		expect((await handleModerationRequest(req('GET', path), env as never)).status).toBe(403)
		expect(auth.requirePermission).toHaveBeenCalledWith(expect.any(Request), env, permission)
		expect(questionSvc.list).not.toHaveBeenCalled()
	})

	it.each([
		['reviewer', ['submitted', 'in_review']],
		['admin', ['in_review', 'approved']],
	])('the %s queue reads %j', async (queue, statuses) => {
		auth.requirePermission.mockResolvedValue(user)
		questionSvc.list.mockResolvedValue({ items: [], total: 0 })
		await handleModerationRequest(req('GET', `/api/moderation/${queue}`), env as never)
		expect(questionSvc.list.mock.calls.map(([filters]) => filters.status)).toEqual(statuses)
		for (const [filters] of questionSvc.list.mock.calls) {
			expect(filters).toMatchObject({ includeDrafts: true, page: 1, pageSize: 50, userId: 'user-1' })
		}
	})

	it('merges both statuses and strips the answer key', async () => {
		auth.requirePermission.mockResolvedValue(user)
		questionSvc.list
			.mockResolvedValueOnce({ items: [{ id: 'a', correctAnswer: 'x', authorId: 'u' }], total: 1 })
			.mockResolvedValueOnce({ items: [{ id: 'b', correctAnswer: 'y', authorId: 'u' }], total: 1 })
		const { status, body } = await read(await handleModerationRequest(req('GET', '/api/moderation/reviewer'), env as never))
		expect(status).toBe(200)
		expect(body).toEqual({ items: [{ id: 'a' }, { id: 'b' }], total: 2 })
	})
})

describe('progress', () => {
	it('401s without a session', async () => {
		const { status, body } = await read(await handleProgressRequest(req('GET', '/api/progress'), env as never))
		expect(status).toBe(401)
		expect(body.error).toBe('Sign in to view progress')
	})

	it('summarises solved and total across topics', async () => {
		auth.getAuthenticatedUser.mockResolvedValue(user)
		questionSvc.progress.mockResolvedValue([{ solved: true }, { solved: false }, { solved: true }])
		questionSvc.topicCounts.mockResolvedValue([{ topicId: 'a', total: '4', solved: 1 }, { topicId: 'b', total: 6, solved: 1 }])
		const { status, body } = await read(await handleProgressRequest(req('GET', '/api/progress'), env as never))
		expect(status).toBe(200)
		expect(body.solved).toBe(2)
		expect(body.total).toBe(10)
		expect(body.topics).toHaveLength(2)
		expect(questionSvc.progress).toHaveBeenCalledWith('user-1')
	})

	it('reports zeros for a brand new user', async () => {
		auth.getAuthenticatedUser.mockResolvedValue(user)
		questionSvc.progress.mockResolvedValue([])
		questionSvc.topicCounts.mockResolvedValue([])
		const { body } = await read(await handleProgressRequest(req('GET', '/api/progress'), env as never))
		expect(body).toEqual({ solved: 0, total: 0, topics: [] })
	})

	it('returns attempt history on /history', async () => {
		auth.getAuthenticatedUser.mockResolvedValue(user)
		questionSvc.history.mockResolvedValue([{ id: 'att-1' }])
		const { body } = await read(await handleProgressRequest(req('GET', '/api/progress/history'), env as never))
		expect(body).toEqual({ items: [{ id: 'att-1' }] })
		expect(questionSvc.history).toHaveBeenCalledWith('user-1')
		expect(questionSvc.progress).not.toHaveBeenCalled()
	})
})

describe('role administration', () => {
	const assignment = { userId: 'u2', role: 'reviewer' }

	it.each(['GET', 'POST', 'DELETE', 'PUT'])('%s needs manage_users', async (method) => {
		const { status, body } = await read(await handleAuthorizationRequest(req(method, '/api/admin/roles', method === 'GET' ? undefined : assignment), env as never))
		expect(status).toBe(403)
		expect(body.error).toBe('Super-admin permission required')
		expect(auth.requirePermission).toHaveBeenCalledWith(expect.any(Request), env, 'manage_users')
		expect(auth.manageRoleTuple).not.toHaveBeenCalled()
		expect(auth.listRoleTuples).not.toHaveBeenCalled()
	})

	describe('as a super admin', () => {
		beforeEach(() => auth.requirePermission.mockResolvedValue(user))

		it('lists the tuples', async () => {
			auth.listRoleTuples.mockResolvedValue([{ user: 'user:u1', relation: 'admin', object: 'organization:low-level-lab' }])
			const { status, body } = await read(await handleAuthorizationRequest(req('GET', '/api/admin/roles'), env as never))
			expect(status).toBe(200)
			expect(body.items).toHaveLength(1)
		})

		it('503s when OpenFGA cannot be read', async () => {
			auth.listRoleTuples.mockRejectedValue(new Error('down'))
			expect((await handleAuthorizationRequest(req('GET', '/api/admin/roles'), env as never)).status).toBe(503)
		})

		it.each([['POST', 'add'], ['DELETE', 'remove']])('%s %ss the tuple', async (method, action) => {
			auth.manageRoleTuple.mockResolvedValue({ user: 'user:u2', relation: 'reviewer', object: 'organization:low-level-lab' })
			const { status, body } = await read(await handleAuthorizationRequest(req(method, '/api/admin/roles', assignment), env as never))
			expect(status).toBe(200)
			expect(body.item.relation).toBe('reviewer')
			expect(auth.manageRoleTuple).toHaveBeenCalledWith(env, assignment, action)
		})

		it('503s when the write fails', async () => {
			auth.manageRoleTuple.mockRejectedValue(new Error('down'))
			expect((await handleAuthorizationRequest(req('POST', '/api/admin/roles', assignment), env as never)).status).toBe(503)
		})

		it.each(['PUT', 'PATCH'])('405s %s', async (method) => {
			expect((await handleAuthorizationRequest(req(method, '/api/admin/roles', assignment), env as never)).status).toBe(405)
		})

		it.each([
			['an unknown role', { userId: 'u2', role: 'owner' }],
			['a blank user', { userId: '  ', role: 'admin' }],
			['a missing user', { role: 'admin' }],
			['a user id over 200 characters', { userId: 'u'.repeat(201), role: 'admin' }],
			['a blank topic', { userId: 'u2', role: 'admin', topicId: '' }],
		])('400s %s', async (_label, body) => {
			expect((await handleAuthorizationRequest(req('POST', '/api/admin/roles', body), env as never)).status).toBe(400)
			expect(auth.manageRoleTuple).not.toHaveBeenCalled()
		})
	})
})

describe('social publish', () => {
	const published = { id: 'q1', title: 'T', body: 'B', slug: 's', topicId: 'caches', status: 'published', correctAnswer: 'secret' }
	const fetchMock = vi.fn()

	beforeEach(() => {
		vi.stubGlobal('fetch', fetchMock)
		fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }))
		questionSvc.get.mockResolvedValue(published)
	})

	it.each([['GET', 'q1'], ['POST', undefined]])('405s %s with id %s', async (method, id) => {
		expect((await handleSocialPublish(req(method, '/api/social/publish/x'), env as never, id)).status).toBe(405)
	})

	it('404s an unpublished question before checking permission', async () => {
		questionSvc.get.mockResolvedValue({ ...published, status: 'approved' })
		expect((await handleSocialPublish(req('POST', '/'), env as never, 'q1')).status).toBe(404)
		expect(auth.requireQuestionPermission).not.toHaveBeenCalled()
	})

	it('404s a missing question', async () => {
		questionSvc.get.mockResolvedValue(undefined)
		expect((await handleSocialPublish(req('POST', '/'), env as never, 'q1')).status).toBe(404)
	})

	it('403s without publish_question', async () => {
		expect((await handleSocialPublish(req('POST', '/'), env as never, 'q1')).status).toBe(403)
		expect(auth.requireQuestionPermission).toHaveBeenCalledWith(expect.any(Request), env, 'publish_question', published)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('503s when the webhook is not configured', async () => {
		auth.requireQuestionPermission.mockResolvedValue(user)
		expect((await handleSocialPublish(req('POST', '/'), {} as never, 'q1')).status).toBe(503)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('posts the public fields only, never the answer key', async () => {
		auth.requireQuestionPermission.mockResolvedValue(user)
		const { status, body } = await read(await handleSocialPublish(req('POST', '/'), env as never, 'q1'))
		expect(status).toBe(200)
		expect(body).toEqual({ published: true, questionId: 'q1' })
		const [url, init] = fetchMock.mock.calls[0]
		expect(url).toBe('https://hooks.example/publish')
		const sent = JSON.parse(init.body)
		expect(sent).toEqual({
			event: 'question.published',
			question: { id: 'q1', title: 'T', body: 'B', slug: 's', topicId: 'caches' },
			actorId: 'user-1',
		})
		expect(init.body).not.toContain('secret')
	})

	it('throws when the webhook fails, for the top-level handler to turn into a 500', async () => {
		auth.requireQuestionPermission.mockResolvedValue(user)
		fetchMock.mockResolvedValue(new Response('nope', { status: 502 }))
		await expect(handleSocialPublish(req('POST', '/'), env as never, 'q1')).rejects.toThrow('status 502')
	})
})

describe('code execution placeholder', () => {
	it('answers 501 and explains the boundary', async () => {
		const { status, body } = await read(codingExecutionPlaceholder())
		expect(status).toBe(501)
		expect(body.error).toMatch(/intentionally unavailable/)
		expect(body.boundary).toMatch(/sandbox/)
	})
})
