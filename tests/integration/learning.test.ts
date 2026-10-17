// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { questionSearchSchema } from '../../types'
import { query, resetDatabase, startDatabase, stopDatabase } from './database'
import { call, fga, installFetch, publishQuestion, queue, register, seedTopic, validQuestion, type Account } from './harness'

// The reader's side over real SQL: answering and grading, progress, history, search, topics,
// moderation queues, and topic management.

vi.mock('../../worker/db/client', async () => (await import('./database')).clientMock)

beforeAll(startDatabase)
afterAll(stopDatabase)

let admin: Account
let learner: Account

beforeEach(async () => {
	await resetDatabase()
	fga.reset()
	queue.send.mockClear()
	installFetch()
	await seedTopic()
	admin = await register('Super Admin')
	fga.grant(admin.id, 'super_admin')
	learner = await register('Learner')
	fga.grant(learner.id, 'member')
})

const right = validQuestion().correctAnswer
const answer = (who: Account, id: string, value: unknown) => call('POST', `/api/questions/${id}/answer`, { cookie: who.cookie, body: { answer: value } })

describe('answering', () => {
	it('grades a right answer and returns the explanation, never the key', async () => {
		const id = await publishQuestion(admin)
		const reply = await answer(learner, id, right)
		expect(reply.status).toBe(200)
		expect(reply.body.correct).toBe(true)
		expect(reply.body.explanation).toBe(validQuestion().explanation)
		expect(reply.body).not.toHaveProperty('correctAnswer')
	})

	it('grades ignoring case and spacing', async () => {
		const id = await publishQuestion(admin)
		expect((await answer(learner, id, `  ${right.toUpperCase().replace(/ /g, '   ')} `)).body.correct).toBe(true)
	})

	it('grades a wrong answer', async () => {
		const id = await publishQuestion(admin)
		expect((await answer(learner, id, 'Linked lists are shorter')).body.correct).toBe(false)
	})

	it('grades multiple choice as a set, in any order', async () => {
		const id = await publishQuestion(admin, { type: 'multiple_choice', options: ['a', 'b', 'c'], correctAnswer: ['a', 'c'], slug: 'multi' })
		expect((await answer(learner, id, ['c', 'a'])).body.correct).toBe(true)
		expect((await answer(learner, id, ['a'])).body.correct).toBe(false)
		expect((await answer(learner, id, ['a', 'b', 'c'])).body.correct).toBe(false)
	})

	it('grades true/false', async () => {
		const id = await publishQuestion(admin, { type: 'true_false', options: [], correctAnswer: 'false', slug: 'tf' })
		expect((await answer(learner, id, 'FALSE')).body.correct).toBe(true)
		expect((await answer(learner, id, 'true')).body.correct).toBe(false)
	})

	it('appends every attempt and keeps one progress row', async () => {
		const id = await publishQuestion(admin)
		await answer(learner, id, 'nope')
		await answer(learner, id, right)
		await answer(learner, id, 'nope again')
		expect(await query('SELECT id FROM question_attempt WHERE user_id = $1', [learner.id])).toHaveLength(3)
		const progress = await query<{ attempts: number; solved: boolean; solved_at: Date | null }>('SELECT attempts, solved, solved_at FROM question_progress WHERE user_id = $1', [learner.id])
		expect(progress).toHaveLength(1)
		expect(progress[0].attempts).toBe(3)
		expect(progress[0].solved).toBe(true)
		expect(progress[0].solved_at).toBeInstanceOf(Date)
	})

	it('keeps solved sticky after a later wrong answer', async () => {
		const id = await publishQuestion(admin)
		await answer(learner, id, right)
		const [before] = await query<{ solved_at: Date }>('SELECT solved_at FROM question_progress')
		await answer(learner, id, 'wrong')
		const [after] = await query<{ solved: boolean; solved_at: Date }>('SELECT solved, solved_at FROM question_progress')
		expect(after.solved).toBe(true)
		expect(after.solved_at.getTime()).toBe(before.solved_at.getTime())
	})

	it('keeps each learner\'s progress separate', async () => {
		const id = await publishQuestion(admin)
		const other = await register('Other')
		fga.grant(other.id, 'member')
		await answer(learner, id, right)
		await answer(other, id, 'wrong')
		const rows = await query<{ user_id: string; solved: boolean }>('SELECT user_id, solved FROM question_progress ORDER BY solved')
		expect(rows).toEqual([{ user_id: other.id, solved: false }, { user_id: learner.id, solved: true }])
	})

	it('refuses a visitor with 401 and stores nothing', async () => {
		const id = await publishQuestion(admin)
		expect((await call('POST', `/api/questions/${id}/answer`, { body: { answer: right } })).status).toBe(401)
		expect(await query('SELECT id FROM question_attempt')).toHaveLength(0)
	})

	it('refuses to grade a draft, so drafts cannot be probed for their answers', async () => {
		const draft = await call('POST', '/api/questions', { cookie: admin.cookie, body: validQuestion({ slug: 'draft-q' }) })
		expect((await answer(learner, draft.body.id, right)).status).toBe(404)
		expect(await query('SELECT id FROM question_attempt')).toHaveLength(0)
	})

	it('400s a malformed answer', async () => {
		const id = await publishQuestion(admin)
		expect((await answer(learner, id, '   ')).status).toBe(400)
		expect((await answer(learner, id, 42)).status).toBe(400)
	})

	// Pinned current behaviour: a body that is not JSON throws inside the controller and the
	// top-level handler turns it into a 500. A 400 would be more accurate.
	it('answers 500 to a body that is not JSON', async () => {
		const id = await publishQuestion(admin)
		vi.spyOn(console, 'error').mockImplementation(() => {})
		expect((await call('POST', `/api/questions/${id}/answer`, { cookie: learner.cookie, rawBody: '{not json' })).status).toBe(500)
	})
})

describe('progress and history', () => {
	it('401s a visitor', async () => {
		expect((await call('GET', '/api/progress')).status).toBe(401)
		expect((await call('GET', '/api/progress/history')).status).toBe(401)
	})

	it('starts empty', async () => {
		await publishQuestion(admin)
		const reply = await call('GET', '/api/progress', { cookie: learner.cookie })
		expect(reply.body).toEqual({ solved: 0, total: 1, topics: [{ topicId: 'caches', total: 1, solved: 0 }] })
	})

	it('counts solved questions per topic', async () => {
		await seedTopic('memory', 'Memory')
		const a = await publishQuestion(admin, { slug: 'a' })
		await publishQuestion(admin, { slug: 'b' })
		await publishQuestion(admin, { slug: 'c', topicId: 'memory' })
		await answer(learner, a, right)
		const reply = await call('GET', '/api/progress', { cookie: learner.cookie })
		expect(reply.body.solved).toBe(1)
		expect(reply.body.total).toBe(3)
		const byTopic = Object.fromEntries(reply.body.topics.map((row: { topicId: string; total: number; solved: number }) => [row.topicId, [Number(row.total), Number(row.solved)]]))
		expect(byTopic).toEqual({ caches: [2, 1], memory: [1, 0] })
	})

	it('does not count drafts in the bank total', async () => {
		await publishQuestion(admin)
		await call('POST', '/api/questions', { cookie: admin.cookie, body: validQuestion({ slug: 'draft' }) })
		expect((await call('GET', '/api/progress', { cookie: learner.cookie })).body.total).toBe(1)
	})

	it('lists attempts newest first with the question title', async () => {
		const id = await publishQuestion(admin)
		await answer(learner, id, 'wrong')
		await new Promise((resolve) => setTimeout(resolve, 5))
		await answer(learner, id, right)
		const reply = await call('GET', '/api/progress/history', { cookie: learner.cookie })
		expect(reply.body.items.map((item: { correct: boolean }) => item.correct)).toEqual([true, false])
		expect(reply.body.items[0].questionTitle).toBe(validQuestion().title)
	})

	it('shows a learner only their own history', async () => {
		const id = await publishQuestion(admin)
		await answer(learner, id, right)
		const other = await register('Other')
		expect((await call('GET', '/api/progress/history', { cookie: other.cookie })).body.items).toEqual([])
	})

	it('marks solved questions in the list for that learner only', async () => {
		const id = await publishQuestion(admin)
		await answer(learner, id, right)
		// The list only joins progress for users who pass the create_question check.
		expect((await call('GET', '/api/questions', { cookie: learner.cookie })).body.items[0].solved).toBe(true)
		expect((await call('GET', '/api/questions')).body.items[0].solved).toBe(false)
	})
})

describe('search and filters', () => {
	beforeEach(async () => {
		await seedTopic('memory', 'Virtual Memory')
		await publishQuestion(admin, { slug: 'tlb', title: 'What does a TLB miss cost?', body: 'Page walk.', topicId: 'memory', subtopic: 'Paging' })
		await publishQuestion(admin, { slug: 'false-sharing', title: 'Why is false sharing slow?', body: 'Cache lines bounce between cores.', type: 'true_false', options: [], correctAnswer: 'true' })
		await publishQuestion(admin, { slug: 'prefetch', title: 'When does the prefetcher help?', body: 'Strided access.', type: 'math', options: [], correctAnswer: '64' })
	})

	const titles = (reply: { body: { items: Array<{ title: string }> } }) => reply.body.items.map((item) => item.title).sort()

	it.each([
		['a word in the title', 'TLB', ['What does a TLB miss cost?']],
		['a word in the body', 'bounce', ['Why is false sharing slow?']],
		['case-insensitively', 'prefetcher', ['When does the prefetcher help?']],
		['a subtopic', 'Paging', ['What does a TLB miss cost?']],
		['the topic name', 'virtual memory', ['What does a TLB miss cost?']],
		['nothing', 'quantum', []],
	])('finds by %s', async (_label, search, expected) => {
		expect(titles(await call('GET', `/api/questions?search=${encodeURIComponent(search)}`))).toEqual(expected)
	})

	it('treats search text as data, not SQL', async () => {
		for (const search of ["' OR 1=1 --", '%', '_', "'; DROP TABLE question; --"]) {
			const reply = await call('GET', `/api/questions?search=${encodeURIComponent(search)}`)
			expect(reply.status).toBe(200)
		}
		expect(await query('SELECT id FROM question')).toHaveLength(3)
	})

	it('filters by topic and by type', async () => {
		expect(titles(await call('GET', '/api/questions?topicId=memory'))).toEqual(['What does a TLB miss cost?'])
		expect(titles(await call('GET', '/api/questions?type=math'))).toEqual(['When does the prefetcher help?'])
		expect(titles(await call('GET', '/api/questions?type=true_false&topicId=memory'))).toEqual([])
	})

	it('pages through results with a stable total', async () => {
		const first = await call('GET', '/api/questions?pageSize=2&page=1')
		const second = await call('GET', '/api/questions?pageSize=2&page=2')
		expect(first.body.total).toBe(3)
		expect(second.body.total).toBe(3)
		expect(first.body.items).toHaveLength(2)
		expect(second.body.items).toHaveLength(1)
		const ids = [...first.body.items, ...second.body.items].map((item: { id: string }) => item.id)
		expect(new Set(ids).size).toBe(3)
	})

	it('returns an empty page past the end', async () => {
		const reply = await call('GET', '/api/questions?pageSize=2&page=9')
		expect(reply.body).toMatchObject({ items: [], total: 3 })
	})

	// KNOWN BUG: the repository implements solved/unsolved filtering, but the request schema only
	// accepts workflow statuses, so the Questions page's Solved / Unsolved filter always gets a 400.
	it.fails('filters to the questions this learner has solved', async () => {
		expect(questionSearchSchema.safeParse({ status: 'solved' }).success).toBe(true)
		const reply = await call('GET', '/api/questions?status=solved', { cookie: learner.cookie })
		expect(reply.status).toBe(200)
	})
})

describe('topics', () => {
	it('lists active topics with published counts and the learner\'s solved count', async () => {
		const id = await publishQuestion(admin)
		await publishQuestion(admin, { slug: 'two' })
		await answer(learner, id, right)
		const reply = await call('GET', '/api/topics', { cookie: learner.cookie })
		expect(reply.body).toEqual([expect.objectContaining({ id: 'caches', name: 'Caches', total: 2, solved: 1 })])
	})

	it('shows a topic with its published questions, without answer keys', async () => {
		await publishQuestion(admin, { subtopic: 'Prefetching' })
		await call('POST', '/api/questions', { cookie: admin.cookie, body: validQuestion({ slug: 'draft' }) })
		const reply = await call('GET', '/api/topics/caches')
		expect(reply.body.questions).toHaveLength(1)
		expect(reply.body.subtopics).toEqual(['Prefetching'])
		expect(reply.body.questions[0]).not.toHaveProperty('correctAnswer')
		expect(reply.body.questions[0]).not.toHaveProperty('authorId')
	})

	it('404s an unknown topic', async () => {
		expect((await call('GET', '/api/topics/nope')).status).toBe(404)
	})

	// KNOWN BUG: edits and archives are checked against `topic:<id>`, whose permissions resolve
	// through a `topic#organization` tuple the app never writes. So a topic created through the API
	// can never be edited or archived again — not even by the super admin who created it.
	it.fails('lets the super admin who created a topic edit it, without manual linking', async () => {
		const created = await call('POST', '/api/topics', { cookie: admin.cookie, body: { name: 'Networking', slug: 'networking' } })
		expect((await call('PUT', `/api/topics/${created.body.id}`, { cookie: admin.cookie, body: { name: 'Networks', slug: 'networking' } })).status).toBe(200)
	})

	it('creates, renames and archives a topic as a content manager', async () => {
		const created = await call('POST', '/api/topics', { cookie: admin.cookie, body: { name: 'Networking', slug: 'networking', description: 'Packets' } })
		expect(created.status).toBe(201)
		fga.linkTopic(created.body.id)
		const renamed = await call('PUT', `/api/topics/${created.body.id}`, { cookie: admin.cookie, body: { name: 'Networks', slug: 'networking' } })
		expect(renamed.body).toMatchObject({ name: 'Networks', description: null })
		await call('DELETE', `/api/topics/${created.body.id}`, { cookie: admin.cookie })
		expect((await call('GET', '/api/topics')).body.map((topic: { id: string }) => topic.id)).toEqual(['caches'])
	})

	it('refuses topic management to a member', async () => {
		expect((await call('POST', '/api/topics', { cookie: learner.cookie, body: { name: 'N', slug: 'n' } })).status).toBe(403)
		expect((await call('DELETE', '/api/topics/caches', { cookie: learner.cookie })).status).toBe(403)
		expect(await query('SELECT archived_at FROM topic WHERE id = $1', ['caches'])).toEqual([{ archived_at: null }])
	})

	it('surfaces a duplicate topic slug as a 500', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		expect((await call('POST', '/api/topics', { cookie: admin.cookie, body: { name: 'Other', slug: 'caches' } })).status).toBe(500)
	})
})

describe('moderation queues', () => {
	async function inStatus(status: 'submitted' | 'in_review' | 'approved', slug: string) {
		const created = await call('POST', '/api/questions', { cookie: admin.cookie, body: validQuestion({ slug, title: slug }) })
		fga.linkQuestion(created.body.id, admin.id, 'caches')
		const path = { submitted: ['submit'], in_review: ['submit', 'start_review'], approved: ['submit', 'start_review', 'approve'] }[status]
		for (const action of path) await call('POST', `/api/questions/${created.body.id}/${action}`, { cookie: admin.cookie, body: {} })
		return created.body.id
	}

	it('shows reviewers submitted and in-review questions, admins in-review and approved', async () => {
		await inStatus('submitted', 'sub')
		await inStatus('in_review', 'rev')
		await inStatus('approved', 'app')
		await publishQuestion(admin, { slug: 'pub' })
		const reviewer = (await call('GET', '/api/moderation/reviewer', { cookie: admin.cookie })).body
		const adminQueue = (await call('GET', '/api/moderation/admin', { cookie: admin.cookie })).body
		expect(reviewer.items.map((item: { title: string }) => item.title).sort()).toEqual(['rev', 'sub'])
		expect(adminQueue.items.map((item: { title: string }) => item.title).sort()).toEqual(['app', 'rev'])
		for (const item of [...reviewer.items, ...adminQueue.items]) expect(item).not.toHaveProperty('correctAnswer')
	})

	it('empties as questions move through', async () => {
		const id = await inStatus('submitted', 'sub')
		for (const action of ['start_review', 'approve', 'publish']) await call('POST', `/api/questions/${id}/${action}`, { cookie: admin.cookie, body: {} })
		expect((await call('GET', '/api/moderation/reviewer', { cookie: admin.cookie })).body.total).toBe(0)
		expect((await call('GET', '/api/moderation/admin', { cookie: admin.cookie })).body.total).toBe(0)
	})
})

describe('routes the Worker answers without a database', () => {
	it('refuses code execution with 501', async () => {
		expect((await call('POST', '/api/questions/q1/execute')).status).toBe(501)
	})

	it('404s a non-API path', async () => {
		expect((await call('GET', '/definitely-not-a-page')).status).toBe(404)
	})
})
