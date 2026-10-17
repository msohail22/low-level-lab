// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetDatabase, startDatabase, stopDatabase } from './database'
import { call, fga, installFetch, queue, register, seedTopic, validQuestion, type Account } from './harness'

// Roles and permissions end to end: role tuples written through /api/admin/roles, then evaluated
// by the fake OpenFGA against openfga/model.fga on every protected route.

vi.mock('../../worker/db/client', async () => (await import('./database')).clientMock)

beforeAll(startDatabase)
afterAll(stopDatabase)

let superAdmin: Account

beforeEach(async () => {
	await resetDatabase()
	fga.reset()
	queue.send.mockClear()
	installFetch()
	await seedTopic()
	superAdmin = await register('Super Admin')
	fga.grant(superAdmin.id, 'super_admin')
})

async function withRole(name: string, role: string) {
	const account = await register(name)
	const assigned = await call('POST', '/api/admin/roles', { cookie: superAdmin.cookie, body: { userId: account.id, role } })
	expect(assigned.status).toBe(200)
	return account
}

async function draft(author: Account, slug = 'q-' + Math.random().toString(36).slice(2, 8)) {
	const reply = await call('POST', '/api/questions', { cookie: author.cookie, body: validQuestion({ slug }) })
	expect(reply.status).toBe(201)
	return reply.body as { id: string; topicId: string }
}

describe('role administration', () => {
	it('lets a super admin assign a role, which OpenFGA then holds', async () => {
		const grace = await withRole('Grace', 'reviewer')
		expect(fga.tuples()).toContainEqual({ user: `user:${grace.id}`, relation: 'reviewer', object: 'organization:low-level-lab' })
	})

	it('lists the assigned roles', async () => {
		const grace = await withRole('Grace', 'admin')
		const reply = await call('GET', '/api/admin/roles', { cookie: superAdmin.cookie })
		expect(reply.body.items).toContainEqual({ user: `user:${grace.id}`, relation: 'admin', object: 'organization:low-level-lab' })
	})

	it('scopes a role to a topic', async () => {
		const grace = await register('Grace')
		await call('POST', '/api/admin/roles', { cookie: superAdmin.cookie, body: { userId: grace.id, role: 'admin', topicId: 'caches' } })
		expect(fga.tuples()).toContainEqual({ user: `user:${grace.id}`, relation: 'admin', object: 'topic:caches' })
	})

	it('removes a role, and the permission goes with it', async () => {
		const grace = await withRole('Grace', 'member')
		expect((await call('POST', '/api/questions', { cookie: grace.cookie, body: validQuestion() })).status).toBe(201)
		await call('DELETE', '/api/admin/roles', { cookie: superAdmin.cookie, body: { userId: grace.id, role: 'member' } })
		expect((await call('POST', '/api/questions', { cookie: grace.cookie, body: validQuestion({ slug: 'other' }) })).status).toBe(403)
	})

	it.each(['admin', 'reviewer', 'member'])('refuses role management to a %s', async (role) => {
		const someone = await withRole('Someone', role)
		expect((await call('GET', '/api/admin/roles', { cookie: someone.cookie })).status).toBe(403)
		const escalate = await call('POST', '/api/admin/roles', { cookie: someone.cookie, body: { userId: someone.id, role: 'super_admin' } })
		expect(escalate.status).toBe(403)
		expect(fga.tuples()).not.toContainEqual(expect.objectContaining({ user: `user:${someone.id}`, relation: 'super_admin' }))
	})

	it('refuses role management to a visitor', async () => {
		expect((await call('POST', '/api/admin/roles', { body: { userId: 'x', role: 'super_admin' } })).status).toBe(403)
	})

	it('validates the assignment', async () => {
		expect((await call('POST', '/api/admin/roles', { cookie: superAdmin.cookie, body: { userId: 'x', role: 'owner' } })).status).toBe(400)
	})
})

describe('what each role can do at the organization level', () => {
	const cases: Array<[string, { createQuestion: boolean; manageTopics: boolean; reviewQueue: boolean; adminQueue: boolean }]> = [
		['super_admin', { createQuestion: true, manageTopics: true, reviewQueue: true, adminQueue: true }],
		['admin', { createQuestion: true, manageTopics: true, reviewQueue: false, adminQueue: true }],
		['reviewer', { createQuestion: true, manageTopics: false, reviewQueue: true, adminQueue: false }],
		['member', { createQuestion: true, manageTopics: false, reviewQueue: false, adminQueue: false }],
	]

	it.each(cases)('%s', async (role, can) => {
		const account = role === 'super_admin' ? superAdmin : await withRole(role, role)
		const expectStatus = (allowed: boolean, status: number) => expect(status === 403).toBe(!allowed)
		expectStatus(can.createQuestion, (await call('POST', '/api/questions', { cookie: account.cookie, body: validQuestion({ slug: `${role}-q` }) })).status)
		expectStatus(can.manageTopics, (await call('POST', '/api/topics', { cookie: account.cookie, body: { name: `${role} topic`, slug: `${role}-topic` } })).status)
		expectStatus(can.reviewQueue, (await call('GET', '/api/moderation/reviewer', { cookie: account.cookie })).status)
		expectStatus(can.adminQueue, (await call('GET', '/api/moderation/admin', { cookie: account.cookie })).status)
	})

	it('gives a signed-in user with no role nothing', async () => {
		const nobody = await register('Nobody')
		expect((await call('POST', '/api/questions', { cookie: nobody.cookie, body: validQuestion() })).status).toBe(403)
		expect((await call('GET', '/api/moderation/reviewer', { cookie: nobody.cookie })).status).toBe(403)
		expect((await call('GET', '/api/questions?manage=1', { cookie: nobody.cookie })).status).toBe(403)
	})
})

describe('question-level permissions', () => {
	// KNOWN BUG, and the most important one in this suite: every question-level permission in
	// openfga/model.fga resolves through tuples on `question:<id>` (author, organization, topic), and
	// the app never writes any of them. So on a real OpenFGA holding this model, nobody — not the
	// author, not a super admin — can edit, submit, review, approve or publish any question. The other
	// tests link questions by hand (fga.linkQuestion) to stand in for the missing write. Fix by writing
	// those three tuples when a question is created, then make these plain `it`s.
	it.fails('lets the author submit their own question without any manual linking', async () => {
		const author = await withRole('Author', 'member')
		const { id } = await draft(author)
		expect((await call('POST', `/api/questions/${id}/submit`, { cookie: author.cookie, body: {} })).status).toBe(200)
	})

	it.fails('lets a super admin edit any question without any manual linking', async () => {
		const author = await withRole('Author', 'member')
		const { id } = await draft(author)
		expect((await call('PUT', `/api/questions/${id}`, { cookie: superAdmin.cookie, body: validQuestion({ title: 'Edited' }) })).status).toBe(200)
	})

	describe('once the question tuples exist', () => {
		let author: Account
		let question: { id: string; topicId: string }

		beforeEach(async () => {
			author = await withRole('Author', 'member')
			question = await draft(author)
			fga.linkQuestion(question.id, author.id, question.topicId)
		})

		it('lets the author edit and submit', async () => {
			expect((await call('PUT', `/api/questions/${question.id}`, { cookie: author.cookie, body: validQuestion({ title: 'Better' }) })).status).toBe(200)
			expect((await call('POST', `/api/questions/${question.id}/submit`, { cookie: author.cookie, body: {} })).status).toBe(200)
		})

		it('does not let another member edit it', async () => {
			const other = await withRole('Other', 'member')
			expect((await call('PUT', `/api/questions/${question.id}`, { cookie: other.cookie, body: validQuestion() })).status).toBe(403)
			expect((await call('DELETE', `/api/questions/${question.id}`, { cookie: other.cookie })).status).toBe(403)
		})

		it('does not let the author review, approve or publish their own question', async () => {
			await call('POST', `/api/questions/${question.id}/submit`, { cookie: author.cookie, body: {} })
			for (const action of ['start_review', 'approve', 'publish']) {
				expect((await call('POST', `/api/questions/${question.id}/${action}`, { cookie: author.cookie, body: {} })).status).toBe(403)
			}
		})

		it('runs the policy: member submits, reviewer reviews, admin approves, super admin publishes', async () => {
			const reviewer = await withRole('Reviewer', 'reviewer')
			const admin = await withRole('Admin', 'admin')
			const steps: Array<[Account, string, string]> = [
				[author, 'submit', 'submitted'],
				[reviewer, 'start_review', 'in_review'],
				[admin, 'approve', 'approved'],
				[superAdmin, 'publish', 'published'],
			]
			for (const [who, action, status] of steps) {
				const reply = await call('POST', `/api/questions/${question.id}/${action}`, { cookie: who.cookie, body: {} })
				expect(reply.status).toBe(200)
				expect(reply.body.status).toBe(status)
			}
		})

		it('does not let a reviewer approve or an admin publish', async () => {
			const reviewer = await withRole('Reviewer', 'reviewer')
			const admin = await withRole('Admin', 'admin')
			await call('POST', `/api/questions/${question.id}/submit`, { cookie: author.cookie, body: {} })
			await call('POST', `/api/questions/${question.id}/start_review`, { cookie: reviewer.cookie, body: {} })
			expect((await call('POST', `/api/questions/${question.id}/approve`, { cookie: reviewer.cookie, body: {} })).status).toBe(403)
			await call('POST', `/api/questions/${question.id}/approve`, { cookie: admin.cookie, body: {} })
			expect((await call('POST', `/api/questions/${question.id}/publish`, { cookie: admin.cookie, body: {} })).status).toBe(403)
		})

		it('lets a topic-scoped reviewer review questions in that topic', async () => {
			const scoped = await register('Scoped Reviewer')
			await call('POST', '/api/admin/roles', { cookie: superAdmin.cookie, body: { userId: scoped.id, role: 'reviewer', topicId: 'caches' } })
			await call('POST', `/api/questions/${question.id}/submit`, { cookie: author.cookie, body: {} })
			expect((await call('POST', `/api/questions/${question.id}/start_review`, { cookie: scoped.cookie, body: {} })).status).toBe(200)
		})

		it('does not let a reviewer scoped to another topic review it', async () => {
			await seedTopic('memory', 'Memory')
			const scoped = await register('Memory Reviewer')
			await call('POST', '/api/admin/roles', { cookie: superAdmin.cookie, body: { userId: scoped.id, role: 'reviewer', topicId: 'memory' } })
			await call('POST', `/api/questions/${question.id}/submit`, { cookie: author.cookie, body: {} })
			expect((await call('POST', `/api/questions/${question.id}/start_review`, { cookie: scoped.cookie, body: {} })).status).toBe(403)
		})

		it('checks against the question object, not the organization', async () => {
			await call('POST', `/api/questions/${question.id}/submit`, { cookie: author.cookie, body: {} })
			expect(fga.checks.at(-1)).toMatchObject({ relation: 'submit_question', object: `question:${question.id}`, user: `user:${author.id}` })
		})
	})
})

describe('failing closed', () => {
	it('denies everything while OpenFGA is down, but public reads still work', async () => {
		fga.setOutage(true)
		expect((await call('POST', '/api/questions', { cookie: superAdmin.cookie, body: validQuestion() })).status).toBe(403)
		expect((await call('GET', '/api/admin/roles', { cookie: superAdmin.cookie })).status).toBe(403)
		expect((await call('GET', '/api/questions')).status).toBe(200)
		expect((await call('GET', '/api/topics')).status).toBe(200)
	})

	it('denies everything in local authorization mode', async () => {
		const { env } = await import('./harness')
		env.OPENFGA_AUTH_MODE = 'local'
		try {
			expect((await call('POST', '/api/questions', { cookie: superAdmin.cookie, body: validQuestion() })).status).toBe(403)
		} finally {
			delete env.OPENFGA_AUTH_MODE
		}
	})

	// KNOWN ISSUE (CLAUDE.md "To do"): the Worker sends bare relation names, the model declares can_*.
	// Against a real OpenFGA holding openfga/model.fga, every check is a 400, so every route denies.
	it.fails('grants a super admin anything when OpenFGA enforces the model relation names', async () => {
		fga.setStrictRelationNames(true)
		expect((await call('POST', '/api/questions', { cookie: superAdmin.cookie, body: validQuestion() })).status).toBe(201)
	})

	it('never trusts a user id sent by the client', async () => {
		const member = await withRole('Member', 'member')
		const reply = await call('POST', '/api/questions', { cookie: member.cookie, body: { ...validQuestion(), authorId: superAdmin.id } })
		expect(reply.status).toBe(201)
		const { query } = await import('./database')
		const [row] = await query<{ author_id: string }>('SELECT author_id FROM question WHERE id = $1', [reply.body.id])
		expect(row.author_id).toBe(member.id)
	})
})
