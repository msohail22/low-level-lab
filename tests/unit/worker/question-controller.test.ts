// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const svc = {
	get: vi.fn(),
	list: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	archive: vi.fn(),
	transition: vi.fn(),
	revisions: vi.fn(),
	restore: vi.fn(),
	answer: vi.fn(),
}
const auth = {
	requirePermission: vi.fn(),
	requireQuestionPermission: vi.fn(),
	getAuthenticatedUser: vi.fn(),
}

vi.mock('../../../worker/db/client', () => ({ createDatabase: () => ({}) }))
vi.mock('../../../worker/services/question-service', () => ({ createQuestionService: () => svc }))
vi.mock('../../../worker/authorization/openfga', () => auth)

const { handleQuestionRequest } = await import('../../../worker/controllers/question-controller')

const env = {} as never
const user = { id: 'user-1' }

const secret = {
	id: 'q1',
	slug: 'cache-miss',
	title: 'Why?',
	body: 'Body',
	type: 'single_choice',
	topicId: 'caches',
	difficulty: 'beginner',
	options: ['a', 'b'],
	status: 'published',
	revision: 2,
	correctAnswer: 'a',
	authorId: 'author-1',
}

const validInput = {
	title: 'Why does a linked list miss cache?',
	slug: 'linked-list',
	body: 'Think.',
	type: 'single_choice',
	topicId: 'caches',
	difficulty: 'beginner',
	options: ['a', 'b'],
	correctAnswer: 'a',
}

function call(method: string, path: string, body?: unknown) {
	const url = new URL(path, 'https://lab.example')
	const segments = url.pathname.split('/').filter(Boolean)
	const request = new Request(url, {
		method,
		...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
	})
	return handleQuestionRequest(request, env, segments[2], segments[3])
}

async function read(response: Response) {
	return { status: response.status, body: await response.json() }
}

function allowAll() {
	auth.requirePermission.mockResolvedValue(user)
	auth.requireQuestionPermission.mockResolvedValue(user)
}

beforeEach(() => {
	vi.clearAllMocks()
	auth.requirePermission.mockResolvedValue(null)
	auth.requireQuestionPermission.mockResolvedValue(null)
	svc.list.mockResolvedValue({ items: [secret], total: 1 })
	svc.get.mockResolvedValue(secret)
})

describe('GET /api/questions', () => {
	it('lists questions for anyone, drafts excluded', async () => {
		const { status, body } = await read(await call('GET', '/api/questions'))
		expect(status).toBe(200)
		expect(body.total).toBe(1)
		expect(svc.list).toHaveBeenCalledWith(expect.objectContaining({ includeDrafts: false, userId: undefined, page: 1, pageSize: 20 }))
	})

	it('strips correctAnswer and authorId from every item', async () => {
		const { body } = await read(await call('GET', '/api/questions'))
		expect(body.items[0]).not.toHaveProperty('correctAnswer')
		expect(body.items[0]).not.toHaveProperty('authorId')
		expect(body.items[0]).toMatchObject({ id: 'q1', title: 'Why?' })
	})

	it('passes the signed-in user id so progress can be joined', async () => {
		allowAll()
		await call('GET', '/api/questions')
		expect(svc.list).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }))
	})

	it('passes the search filters through', async () => {
		await call('GET', '/api/questions?search=tlb&topicId=caches&type=math&page=2&pageSize=5')
		expect(svc.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'tlb', topicId: 'caches', type: 'math', page: 2, pageSize: 5 }))
	})

	it.each([
		['page=0'],
		['page=-1'],
		['page=abc'],
		['pageSize=0'],
		['pageSize=51'],
		['type=essay'],
		['status=solved'],
		[`search=${'x'.repeat(201)}`],
	])('rejects the filter %s with 400', async (query) => {
		const { status, body } = await read(await call('GET', `/api/questions?${query}`))
		expect(status).toBe(400)
		expect(body.error).toBe('Invalid search filters')
		expect(svc.list).not.toHaveBeenCalled()
	})

	it.each([['pageSize=1'], ['pageSize=50'], ['page=1'], [`search=${'x'.repeat(200)}`]])('accepts the boundary %s', async (query) => {
		expect((await call('GET', `/api/questions?${query}`)).status).toBe(200)
	})

	it('requires create_question to see the management listing', async () => {
		const { status } = await read(await call('GET', '/api/questions?manage=1'))
		expect(status).toBe(403)
		expect(svc.list).not.toHaveBeenCalled()
	})

	it('includes drafts for a manager', async () => {
		allowAll()
		await call('GET', '/api/questions?manage=1')
		expect(auth.requirePermission).toHaveBeenCalledWith(expect.any(Request), env, 'create_question', undefined)
		expect(svc.list).toHaveBeenCalledWith(expect.objectContaining({ includeDrafts: true }))
	})

	it.each(['0', 'true', 'yes', ''])('does not treat manage=%s as a management request', async (value) => {
		await call('GET', `/api/questions?manage=${value}`)
		expect(svc.list).toHaveBeenCalledWith(expect.objectContaining({ includeDrafts: false }))
	})
})

describe('GET /api/questions/:id', () => {
	it('returns a published question without the answer key', async () => {
		const { status, body } = await read(await call('GET', '/api/questions/q1'))
		expect(status).toBe(200)
		expect(body).not.toHaveProperty('correctAnswer')
		expect(body).not.toHaveProperty('authorId')
		expect(body.title).toBe('Why?')
	})

	it.each(['draft', 'submitted', 'in_review', 'approved', 'changes_requested', 'rejected', 'archived'])('404s a %s question', async (statusName) => {
		svc.get.mockResolvedValue({ ...secret, status: statusName })
		const { status, body } = await read(await call('GET', '/api/questions/q1'))
		expect(status).toBe(404)
		expect(body).toEqual({ error: 'Question not found' })
	})

	it('404s an unknown question', async () => {
		svc.get.mockResolvedValue(undefined)
		expect((await call('GET', '/api/questions/nope')).status).toBe(404)
	})
})

describe('GET /api/questions/:id/revisions', () => {
	it('requires edit_question on that question', async () => {
		expect((await call('GET', '/api/questions/q1/revisions')).status).toBe(403)
		expect(auth.requireQuestionPermission).toHaveBeenCalledWith(expect.any(Request), env, 'edit_question', secret)
		expect(svc.revisions).not.toHaveBeenCalled()
	})

	it('403s for a missing question without asking OpenFGA', async () => {
		svc.get.mockResolvedValue(undefined)
		expect((await call('GET', '/api/questions/q1/revisions')).status).toBe(403)
		expect(auth.requireQuestionPermission).not.toHaveBeenCalled()
	})

	it('returns the revisions to an editor', async () => {
		allowAll()
		svc.revisions.mockResolvedValue([{ revision: 1 }, { revision: 2 }])
		const { status, body } = await read(await call('GET', '/api/questions/q1/revisions'))
		expect(status).toBe(200)
		expect(body).toEqual([{ revision: 1 }, { revision: 2 }])
	})
})

describe('POST /api/questions/:id/restore', () => {
	it('requires edit_question', async () => {
		expect((await call('POST', '/api/questions/q1/restore?revision=1')).status).toBe(403)
		expect(svc.restore).not.toHaveBeenCalled()
	})

	it('403s for a missing question', async () => {
		svc.get.mockResolvedValue(undefined)
		expect((await call('POST', '/api/questions/q1/restore?revision=1')).status).toBe(403)
	})

	it.each(['', 'revision=0', 'revision=-1', 'revision=1.5', 'revision=abc'])('rejects %s with 400', async (query) => {
		allowAll()
		const { status, body } = await read(await call('POST', `/api/questions/q1/restore?${query}`))
		expect(status).toBe(400)
		expect(body.error).toBe('A valid revision is required')
		expect(svc.restore).not.toHaveBeenCalled()
	})

	it('restores and returns the question', async () => {
		allowAll()
		svc.restore.mockResolvedValue({ id: 'q1', revision: 3 })
		const { status, body } = await read(await call('POST', '/api/questions/q1/restore?revision=1'))
		expect(status).toBe(200)
		expect(body).toEqual({ id: 'q1', revision: 3 })
		expect(svc.restore).toHaveBeenCalledWith('q1', 1, 'user-1')
	})

	it('404s an unknown revision', async () => {
		allowAll()
		svc.restore.mockResolvedValue(null)
		expect((await call('POST', '/api/questions/q1/restore?revision=9')).status).toBe(404)
	})
})

describe('POST /api/questions/:id/answer', () => {
	it('401s without a permitted session', async () => {
		const { status, body } = await read(await call('POST', '/api/questions/q1/answer', { answer: 'a' }))
		expect(status).toBe(401)
		expect(body.error).toBe('Sign in to submit an answer')
		expect(svc.answer).not.toHaveBeenCalled()
	})

	it('grades the answer for the signed-in user', async () => {
		allowAll()
		svc.answer.mockResolvedValue({ correct: true, explanation: 'Because', progress: {} })
		const { status, body } = await read(await call('POST', '/api/questions/q1/answer', { answer: 'a' }))
		expect(status).toBe(200)
		expect(body.correct).toBe(true)
		expect(svc.answer).toHaveBeenCalledWith('q1', 'user-1', { answer: 'a' })
	})

	it('accepts an array answer', async () => {
		allowAll()
		svc.answer.mockResolvedValue({ correct: false })
		await call('POST', '/api/questions/q1/answer', { answer: ['a', 'b'] })
		expect(svc.answer).toHaveBeenCalledWith('q1', 'user-1', { answer: ['a', 'b'] })
	})

	it.each([
		['missing answer', {}],
		['blank answer', { answer: '   ' }],
		['numeric answer', { answer: 42 }],
		['too long', { answer: 'x'.repeat(5001) }],
		['eleven choices', { answer: Array.from({ length: 11 }, (_, i) => `o${i}`) }],
	])('400s a %s', async (_label, body) => {
		allowAll()
		expect((await call('POST', '/api/questions/q1/answer', body)).status).toBe(400)
		expect(svc.answer).not.toHaveBeenCalled()
	})

	it('404s when the service cannot find a gradable question', async () => {
		allowAll()
		svc.answer.mockResolvedValue({ error: 'Question not found' })
		expect((await call('POST', '/api/questions/q1/answer', { answer: 'a' })).status).toBe(404)
	})

	it('throws on a malformed JSON body rather than grading it', async () => {
		allowAll()
		await expect(call('POST', '/api/questions/q1/answer', '{not json')).rejects.toThrow()
		expect(svc.answer).not.toHaveBeenCalled()
	})
})

describe('POST /api/questions/:id/:transition', () => {
	it.each([
		['submit', 'submit_question'],
		['approve', 'approve_question'],
		['publish', 'publish_question'],
		['start_review', 'review_question'],
		['request_changes', 'review_question'],
		['reject', 'review_question'],
		['anything_else', 'review_question'],
	])('%s needs %s on that question', async (action, permission) => {
		const response = await call('POST', `/api/questions/q1/${action}`, {})
		expect(response.status).toBe(403)
		expect(auth.requireQuestionPermission).toHaveBeenCalledWith(expect.any(Request), env, permission, secret)
		expect(svc.transition).not.toHaveBeenCalled()
	})

	it('404s an unknown question before checking permission', async () => {
		svc.get.mockResolvedValue(undefined)
		expect((await call('POST', '/api/questions/q1/submit', {})).status).toBe(404)
		expect(auth.requireQuestionPermission).not.toHaveBeenCalled()
	})

	it('applies the transition with the reason', async () => {
		allowAll()
		svc.transition.mockResolvedValue({ item: { id: 'q1', status: 'rejected' } })
		const { status, body } = await read(await call('POST', '/api/questions/q1/reject', { reason: 'Unclear' }))
		expect(status).toBe(200)
		expect(body).toEqual({ id: 'q1', status: 'rejected' })
		expect(svc.transition).toHaveBeenCalledWith('q1', 'reject', 'user-1', 'Unclear')
	})

	it('409s an illegal transition', async () => {
		allowAll()
		svc.transition.mockResolvedValue({ error: 'Invalid workflow transition' })
		const { status, body } = await read(await call('POST', '/api/questions/q1/publish', {}))
		expect(status).toBe(409)
		expect(body.error).toBe('Invalid workflow transition')
	})

	it('400s a reason over 1000 characters', async () => {
		allowAll()
		expect((await call('POST', '/api/questions/q1/reject', { reason: 'x'.repeat(1001) })).status).toBe(400)
	})

	it('accepts a null reason', async () => {
		allowAll()
		svc.transition.mockResolvedValue({ item: {} })
		expect((await call('POST', '/api/questions/q1/submit', { reason: null })).status).toBe(200)
	})
})

describe('POST /api/questions', () => {
	it('403s without create_question', async () => {
		expect((await call('POST', '/api/questions', validInput)).status).toBe(403)
		expect(svc.create).not.toHaveBeenCalled()
	})

	it('creates and returns 201', async () => {
		allowAll()
		svc.create.mockResolvedValue({ id: 'new' })
		const { status, body } = await read(await call('POST', '/api/questions', validInput))
		expect(status).toBe(201)
		expect(body).toEqual({ id: 'new' })
		expect(svc.create).toHaveBeenCalledWith(expect.objectContaining({ title: validInput.title }), 'user-1')
	})

	it('400s invalid input with the Zod issues', async () => {
		allowAll()
		const { status, body } = await read(await call('POST', '/api/questions', { ...validInput, slug: 'Not A Slug' }))
		expect(status).toBe(400)
		expect(body.error).toBe('Invalid request')
		expect(body.issues).toBeDefined()
		expect(svc.create).not.toHaveBeenCalled()
	})

	it('ignores an authorId smuggled into the body', async () => {
		allowAll()
		svc.create.mockResolvedValue({})
		await call('POST', '/api/questions', { ...validInput, authorId: 'someone-else' })
		expect(svc.create.mock.calls[0][0]).not.toHaveProperty('authorId')
		expect(svc.create.mock.calls[0][1]).toBe('user-1')
	})
})

describe('PUT and DELETE /api/questions/:id', () => {
	it('403s an edit without edit_question', async () => {
		expect((await call('PUT', '/api/questions/q1', validInput)).status).toBe(403)
		expect(svc.update).not.toHaveBeenCalled()
	})

	it('403s an edit to an unknown question', async () => {
		svc.get.mockResolvedValue(undefined)
		allowAll()
		expect((await call('PUT', '/api/questions/q1', validInput)).status).toBe(403)
	})

	it('updates a question', async () => {
		allowAll()
		svc.update.mockResolvedValue({ id: 'q1', revision: 3 })
		const { status } = await read(await call('PUT', '/api/questions/q1', validInput))
		expect(status).toBe(200)
		expect(svc.update).toHaveBeenCalledWith('q1', expect.objectContaining({ title: validInput.title }), 'user-1')
	})

	it('400s an invalid edit', async () => {
		allowAll()
		expect((await call('PUT', '/api/questions/q1', { ...validInput, title: '' })).status).toBe(400)
	})

	it('404s when the update matched nothing', async () => {
		allowAll()
		svc.update.mockResolvedValue(null)
		expect((await call('PUT', '/api/questions/q1', validInput)).status).toBe(404)
	})

	it('403s an archive without edit_question', async () => {
		expect((await call('DELETE', '/api/questions/q1')).status).toBe(403)
		expect(svc.archive).not.toHaveBeenCalled()
	})

	it('archives a question', async () => {
		allowAll()
		svc.archive.mockResolvedValue([{ id: 'q1', status: 'archived' }])
		const { status, body } = await read(await call('DELETE', '/api/questions/q1'))
		expect(status).toBe(200)
		expect(body.status).toBe('archived')
	})

	it('404s an archive that matched nothing', async () => {
		allowAll()
		svc.archive.mockResolvedValue([])
		expect((await call('DELETE', '/api/questions/q1')).status).toBe(404)
	})

	it('405s an unsupported method on a question the user can edit', async () => {
		allowAll()
		expect((await call('PATCH', '/api/questions/q1', validInput)).status).toBe(405)
	})

	it('403s rather than 405s an unsupported method on the collection', async () => {
		allowAll()
		expect((await call('PUT', '/api/questions', validInput)).status).toBe(403)
	})
})
