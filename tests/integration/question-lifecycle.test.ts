// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { query, resetDatabase, startDatabase, stopDatabase } from './database'
import { call, fga, installFetch, publishQuestion, queue, register, seedTopic, validQuestion, type Account } from './harness'

// A question's whole life over HTTP: create, edit, the review workflow, revisions, restore, archive.

vi.mock('../../worker/db/client', async () => (await import('./database')).clientMock)

beforeAll(startDatabase)
afterAll(stopDatabase)

let admin: Account

beforeEach(async () => {
	await resetDatabase()
	fga.reset()
	queue.send.mockClear()
	installFetch()
	await seedTopic()
	admin = await register('Super Admin')
	fga.grant(admin.id, 'super_admin')
})

async function create(overrides: Record<string, unknown> = {}, who = admin) {
	const reply = await call('POST', '/api/questions', { cookie: who.cookie, body: validQuestion(overrides) })
	if (reply.status === 201) fga.linkQuestion(reply.body.id, who.id, reply.body.topicId)
	return reply
}

describe('creating', () => {
	it('stores a draft with revision 1 and a content hash', async () => {
		const reply = await create()
		expect(reply.status).toBe(201)
		const [row] = await query<{ status: string; revision: number; content_hash: string; author_id: string }>('SELECT status, revision, content_hash, author_id FROM question')
		expect(row.status).toBe('draft')
		expect(row.revision).toBe(1)
		expect(row.content_hash).toMatch(/^[0-9a-f]{64}$/)
		expect(row.author_id).toBe(admin.id)
	})

	it('writes the first revision snapshot', async () => {
		await create()
		const revisions = await query<{ revision: number; created_by: string; title: string }>('SELECT revision, created_by, title FROM question_revision')
		expect(revisions).toEqual([{ revision: 1, created_by: admin.id, title: validQuestion().title }])
	})

	it('keeps the answer key in the database as JSON', async () => {
		await create({ type: 'multiple_choice', options: ['a', 'b', 'c'], correctAnswer: ['a', 'c'] })
		const [row] = await query<{ correct_answer: unknown }>('SELECT correct_answer FROM question')
		expect(row.correct_answer).toEqual(['a', 'c'])
	})

	it('refuses a signed-out visitor', async () => {
		const reply = await call('POST', '/api/questions', { body: validQuestion() })
		expect(reply.status).toBe(403)
		expect(await query('SELECT id FROM question')).toHaveLength(0)
	})

	it('refuses a signed-in user with no role', async () => {
		const nobody = await register('No Role')
		expect((await create({}, nobody)).status).toBe(403)
	})

	it('lets a plain member create a question', async () => {
		const member = await register('Member')
		fga.grant(member.id, 'member')
		expect((await create({}, member)).status).toBe(201)
	})

	it('rejects invalid input before anything is stored', async () => {
		const reply = await create({ correctAnswer: 'Not one of the options' })
		expect(reply.status).toBe(400)
		expect(reply.body.error).toBe('Invalid request')
		expect(await query('SELECT id FROM question')).toHaveLength(0)
	})

	it('surfaces a duplicate slug as a 500 without a partial write', async () => {
		await create()
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const again = await create()
		expect(again.status).toBe(500)
		expect(await query('SELECT id FROM question')).toHaveLength(1)
		expect(await query('SELECT id FROM question_revision')).toHaveLength(1)
	})

	it('surfaces an unknown topic as a 500 (foreign key) and stores nothing', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		expect((await create({ topicId: 'no-such-topic' })).status).toBe(500)
		expect(await query('SELECT id FROM question')).toHaveLength(0)
	})
})

describe('the review workflow', () => {
	it('walks draft → submitted → in_review → approved → published', async () => {
		const { body } = await create()
		const seen: string[] = []
		for (const action of ['submit', 'start_review', 'approve', 'publish']) {
			const step = await call('POST', `/api/questions/${body.id}/${action}`, { cookie: admin.cookie, body: {} })
			expect(step.status).toBe(200)
			seen.push(step.body.status)
		}
		expect(seen).toEqual(['submitted', 'in_review', 'approved', 'published'])
	})

	it('records one workflow event per step, in order', async () => {
		const id = await publishQuestion(admin)
		const events = await query<{ from_status: string; to_status: string; actor_id: string }>(
			'SELECT from_status, to_status, actor_id FROM question_workflow_event WHERE question_id = $1 ORDER BY created_at, from_status', [id])
		expect(events.map((event) => `${event.from_status}>${event.to_status}`).sort()).toEqual(
			['approved>published', 'draft>submitted', 'in_review>approved', 'submitted>in_review'])
		expect(events.every((event) => event.actor_id === admin.id)).toBe(true)
	})

	it('stamps submitted, approved and published times', async () => {
		const id = await publishQuestion(admin)
		const [row] = await query<Record<string, Date | null>>('SELECT submitted_at, approved_at, published_at FROM question WHERE id = $1', [id])
		expect(row.submitted_at).toBeInstanceOf(Date)
		expect(row.approved_at).toBeInstanceOf(Date)
		expect(row.published_at).toBeInstanceOf(Date)
	})

	it('refuses to skip a step with 409 and leaves the status alone', async () => {
		const { body } = await create()
		const skip = await call('POST', `/api/questions/${body.id}/publish`, { cookie: admin.cookie, body: {} })
		expect(skip.status).toBe(409)
		const [row] = await query<{ status: string }>('SELECT status FROM question')
		expect(row.status).toBe('draft')
		expect(await query('SELECT id FROM question_workflow_event')).toHaveLength(0)
	})

	it('sends a question back with a reason, and lets the author resubmit', async () => {
		const { body } = await create()
		await call('POST', `/api/questions/${body.id}/submit`, { cookie: admin.cookie, body: {} })
		await call('POST', `/api/questions/${body.id}/start_review`, { cookie: admin.cookie, body: {} })
		const back = await call('POST', `/api/questions/${body.id}/request_changes`, { cookie: admin.cookie, body: { reason: 'Add a diagram' } })
		expect(back.body.status).toBe('changes_requested')
		expect(back.body.rejectionReason).toBe('Add a diagram')
		const again = await call('POST', `/api/questions/${body.id}/submit`, { cookie: admin.cookie, body: {} })
		expect(again.body.status).toBe('submitted')
		expect(again.body.rejectionReason).toBeNull()
	})

	it('rejects and allows resubmission from rejected', async () => {
		const { body } = await create()
		for (const action of ['submit', 'start_review']) await call('POST', `/api/questions/${body.id}/${action}`, { cookie: admin.cookie, body: {} })
		const rejected = await call('POST', `/api/questions/${body.id}/reject`, { cookie: admin.cookie, body: { reason: 'Off topic' } })
		expect(rejected.body.status).toBe('rejected')
		expect((await call('POST', `/api/questions/${body.id}/submit`, { cookie: admin.cookie, body: {} })).body.status).toBe('submitted')
	})

	it('404s a transition on a question that does not exist', async () => {
		expect((await call('POST', '/api/questions/missing/submit', { cookie: admin.cookie, body: {} })).status).toBe(404)
	})

	// KNOWN BUG: an inherited key as the action crashes the service (500) instead of answering 409.
	it.fails('answers 409, not 500, for a prototype key used as an action', async () => {
		const { body } = await create()
		vi.spyOn(console, 'error').mockImplementation(() => {})
		expect((await call('POST', `/api/questions/${body.id}/toString`, { cookie: admin.cookie, body: {} })).status).toBe(409)
	})
})

describe('visibility', () => {
	it('hides a draft from the public detail route', async () => {
		const { body } = await create()
		expect((await call('GET', `/api/questions/${body.id}`)).status).toBe(404)
	})

	it('shows a published question publicly, without the answer key or author', async () => {
		const id = await publishQuestion(admin)
		const reply = await call('GET', `/api/questions/${id}`)
		expect(reply.status).toBe(200)
		expect(reply.body.title).toBe(validQuestion().title)
		expect(reply.body).not.toHaveProperty('correctAnswer')
		expect(reply.body).not.toHaveProperty('authorId')
	})

	it('never sends a free-text answer to the client', async () => {
		const id = await publishQuestion(admin, { type: 'math', options: [], correctAnswer: '4096', explanation: null, slug: 'page-size' })
		const detail = await call('GET', `/api/questions/${id}`)
		const list = await call('GET', '/api/questions')
		expect(JSON.stringify(detail.body)).not.toContain('4096')
		expect(JSON.stringify(list.body)).not.toContain('4096')
	})

	// Pinned current behaviour, worth a decision: the explanation is returned before the reader has
	// answered. The UI only shows it afterwards, but it is in the response, and an explanation
	// usually gives the answer away. Stripping it here and returning it only from /answer would close that.
	it('returns the explanation before the question is answered', async () => {
		const id = await publishQuestion(admin)
		expect((await call('GET', `/api/questions/${id}`)).body.explanation).toBe(validQuestion().explanation)
	})

	it('lists only published questions publicly', async () => {
		await publishQuestion(admin)
		await create({ slug: 'a-draft', title: 'A draft' })
		const reply = await call('GET', '/api/questions')
		expect(reply.body.total).toBe(1)
		expect(reply.body.items.map((item: { slug: string }) => item.slug)).toEqual(['linked-list-cache-miss'])
	})

	it('lists drafts too in the management view', async () => {
		await publishQuestion(admin)
		await create({ slug: 'a-draft', title: 'A draft' })
		const reply = await call('GET', '/api/questions?manage=1', { cookie: admin.cookie })
		expect(reply.body.total).toBe(2)
		for (const item of reply.body.items) expect(item).not.toHaveProperty('correctAnswer')
	})

	it('refuses the management view to a visitor', async () => {
		expect((await call('GET', '/api/questions?manage=1')).status).toBe(403)
	})
})

describe('editing, revisions and restore', () => {
	it('bumps the revision and snapshots each edit', async () => {
		const { body } = await create()
		const edited = await call('PUT', `/api/questions/${body.id}`, { cookie: admin.cookie, body: validQuestion({ title: 'Second title' }) })
		expect(edited.status).toBe(200)
		expect(edited.body.revision).toBe(2)
		const revisions = await call('GET', `/api/questions/${body.id}/revisions`, { cookie: admin.cookie })
		expect(revisions.body.map((row: { revision: number; title: string }) => [row.revision, row.title])).toEqual([
			[2, 'Second title'],
			[1, validQuestion().title],
		])
	})

	it('drops a published question back to draft when edited', async () => {
		const id = await publishQuestion(admin)
		const edited = await call('PUT', `/api/questions/${id}`, { cookie: admin.cookie, body: validQuestion({ title: 'Fixed typo' }) })
		expect(edited.body.status).toBe('draft')
		expect((await call('GET', `/api/questions/${id}`)).status).toBe(404)
	})

	it('changes the content hash only when the content changes', async () => {
		const { body } = await create()
		await call('PUT', `/api/questions/${body.id}`, { cookie: admin.cookie, body: validQuestion() })
		await call('PUT', `/api/questions/${body.id}`, { cookie: admin.cookie, body: validQuestion({ body: 'Different body' }) })
		const hashes = (await query<{ content_hash: string }>('SELECT content_hash FROM question_revision ORDER BY revision')).map((row) => row.content_hash)
		expect(hashes[0]).toBe(hashes[1])
		expect(hashes[2]).not.toBe(hashes[1])
	})

	it('restores an old revision as a new draft revision', async () => {
		const id = await publishQuestion(admin)
		await call('PUT', `/api/questions/${id}`, { cookie: admin.cookie, body: validQuestion({ title: 'Worse title' }) })
		const restored = await call('POST', `/api/questions/${id}/restore?revision=1`, { cookie: admin.cookie, body: {} })
		expect(restored.status).toBe(200)
		expect(restored.body).toMatchObject({ title: validQuestion().title, revision: 3, status: 'draft', publishedAt: null })
		expect(await query('SELECT id FROM question_revision WHERE question_id = $1', [id])).toHaveLength(3)
	})

	it('404s a revision that does not exist', async () => {
		const { body } = await create()
		expect((await call('POST', `/api/questions/${body.id}/restore?revision=9`, { cookie: admin.cookie, body: {} })).status).toBe(404)
	})

	it('refuses revisions and restore to someone who cannot edit', async () => {
		const { body } = await create()
		const member = await register('Member')
		fga.grant(member.id, 'member')
		expect((await call('GET', `/api/questions/${body.id}/revisions`, { cookie: member.cookie })).status).toBe(403)
		expect((await call('POST', `/api/questions/${body.id}/restore?revision=1`, { cookie: member.cookie, body: {} })).status).toBe(403)
	})

	it('archives a question, hiding it from every list', async () => {
		const id = await publishQuestion(admin)
		const archived = await call('DELETE', `/api/questions/${id}`, { cookie: admin.cookie })
		expect(archived.body.status).toBe('archived')
		expect((await call('GET', '/api/questions')).body.total).toBe(0)
		expect((await call('GET', '/api/questions?manage=1', { cookie: admin.cookie })).body.total).toBe(0)
		expect(await query('SELECT id FROM question')).toHaveLength(1)
	})
})
