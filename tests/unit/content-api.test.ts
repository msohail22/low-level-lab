import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as api from '@services/content-api'

const fetchMock = vi.fn()

beforeEach(() => {
	fetchMock.mockReset().mockResolvedValue(Response.json({ ok: true }))
	vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

function lastCall() {
	const [url, init] = fetchMock.mock.calls.at(-1)!
	return { url: url as string, init: init as RequestInit & { headers: Record<string, string> } }
}

describe('every request', () => {
	it('sends the session cookie', async () => {
		await api.listTopics()
		expect(lastCall().init.credentials).toBe('include')
	})

	it('declares a JSON content type', async () => {
		await api.listTopics()
		expect(lastCall().init.headers['content-type']).toBe('application/json')
	})

	it('returns the parsed body', async () => {
		fetchMock.mockResolvedValue(Response.json([{ id: 't1' }]))
		await expect(api.listTopics()).resolves.toEqual([{ id: 't1' }])
	})
})

describe('errors', () => {
	it('throws ApiError carrying the server message and status', async () => {
		fetchMock.mockResolvedValue(Response.json({ error: 'Question not found' }, { status: 404 }))
		const error = await api.getQuestion('q1').catch((reason: unknown) => reason)
		expect(error).toBeInstanceOf(api.ApiError)
		expect(error).toBeInstanceOf(Error)
		expect((error as api.ApiError).message).toBe('Question not found')
		expect((error as api.ApiError).status).toBe(404)
	})

	it('falls back to a status message when the body has no error', async () => {
		fetchMock.mockResolvedValue(Response.json({}, { status: 500 }))
		await expect(api.listTopics()).rejects.toThrow('Request failed (500)')
	})

	it('falls back to a status message when the body is not JSON', async () => {
		fetchMock.mockResolvedValue(new Response('<html>502</html>', { status: 502 }))
		await expect(api.listTopics()).rejects.toMatchObject({ message: 'Request failed (502)', status: 502 })
	})

	it.each([400, 401, 403, 409, 503])('rejects on %i', async (status) => {
		fetchMock.mockResolvedValue(Response.json({ error: 'x' }, { status }))
		await expect(api.listTopics()).rejects.toMatchObject({ status })
	})

	it('lets a network failure through', async () => {
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
		await expect(api.listTopics()).rejects.toThrow('Failed to fetch')
	})
})

describe('listQuestions', () => {
	it('sends no filters by default', async () => {
		await api.listQuestions()
		expect(lastCall().url).toBe('/api/questions?')
	})

	it('encodes the filters it is given', async () => {
		await api.listQuestions({ search: 'cache line', page: 2, pageSize: 10 })
		const url = new URL(lastCall().url, 'https://x')
		expect(url.pathname).toBe('/api/questions')
		expect(Object.fromEntries(url.searchParams)).toEqual({ search: 'cache line', page: '2', pageSize: '10' })
	})

	it('drops undefined and empty values', async () => {
		await api.listQuestions({ search: '', type: undefined, topicId: 'caches' })
		expect(lastCall().url).toBe('/api/questions?topicId=caches')
	})

	it('keeps zero', async () => {
		await api.listQuestions({ page: 0 })
		expect(lastCall().url).toBe('/api/questions?page=0')
	})

	it('escapes characters that would break the query', async () => {
		await api.listQuestions({ search: 'a&b=c' })
		expect(new URL(lastCall().url, 'https://x').searchParams.get('search')).toBe('a&b=c')
	})
})

describe('endpoints', () => {
	it.each([
		['getQuestion', () => api.getQuestion('q1'), '/api/questions/q1', 'GET'],
		['listTopics', () => api.listTopics(), '/api/topics', 'GET'],
		['getTopic default page', () => api.getTopic('caches'), '/api/topics/caches?page=1', 'GET'],
		['getTopic page 3', () => api.getTopic('caches', 3), '/api/topics/caches?page=3', 'GET'],
		['getProgress', () => api.getProgress(), '/api/progress', 'GET'],
		['getProgressHistory', () => api.getProgressHistory(), '/api/progress/history', 'GET'],
		['getRevisions', () => api.getRevisions('q1'), '/api/questions/q1/revisions', 'GET'],
		['listModeration reviewer', () => api.listModeration('reviewer'), '/api/moderation/reviewer', 'GET'],
		['listModeration admin', () => api.listModeration('admin'), '/api/moderation/admin', 'GET'],
		['listRoleTuples', () => api.listRoleTuples(), '/api/admin/roles', 'GET'],
	])('%s calls %s', async (_label, run, url, method) => {
		await run()
		expect(lastCall().url).toBe(url)
		expect(lastCall().init.method ?? 'GET').toBe(method)
	})

	it.each([
		['submitAnswer string', () => api.submitAnswer('q1', 'a'), '/api/questions/q1/answer', 'POST', { answer: 'a' }],
		['submitAnswer array', () => api.submitAnswer('q1', ['a', 'b']), '/api/questions/q1/answer', 'POST', { answer: ['a', 'b'] }],
		['createTopic', () => api.createTopic({ name: 'N' }), '/api/topics', 'POST', { name: 'N' }],
		['createQuestion', () => api.createQuestion({ title: 'T' }), '/api/questions', 'POST', { title: 'T' }],
		['restoreRevision', () => api.restoreRevision('q1', 2), '/api/questions/q1/restore?revision=2', 'POST', {}],
		['transition with reason', () => api.transitionQuestion('q1', 'reject', 'Unclear'), '/api/questions/q1/reject', 'POST', { reason: 'Unclear' }],
		['transition without reason', () => api.transitionQuestion('q1', 'approve'), '/api/questions/q1/approve', 'POST', { reason: null }],
		['transition with blank reason', () => api.transitionQuestion('q1', 'approve', ''), '/api/questions/q1/approve', 'POST', { reason: null }],
		['assignRole', () => api.assignRole({ userId: 'u', role: 'admin' }), '/api/admin/roles', 'POST', { userId: 'u', role: 'admin' }],
		['removeRole', () => api.removeRole({ userId: 'u', role: 'admin', topicId: 't' }), '/api/admin/roles', 'DELETE', { userId: 'u', role: 'admin', topicId: 't' }],
	])('%s sends %s %s', async (_label, run, url, method, body) => {
		await run()
		expect(lastCall().url).toBe(url)
		expect(lastCall().init.method).toBe(method)
		expect(JSON.parse(lastCall().init.body as string)).toEqual(body)
	})
})
