// @vitest-environment node
import { createHash } from 'node:crypto'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { questionStatuses, type QuestionInput } from '../../../types'

// The service is pure workflow over a repository, so the repository is the only seam.
const repo = {
	findPage: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	createRevision: vi.fn(),
	createWorkflowEvent: vi.fn(),
	listRevisions: vi.fn(),
	findRevision: vi.fn(),
	createAttempt: vi.fn(),
	findProgressForQuestion: vi.fn(),
	upsertProgress: vi.fn(),
	findProgress: vi.fn(),
	findAttempts: vi.fn(),
	findTopicCounts: vi.fn(),
}

vi.mock('../../../worker/repositories/question-repository', () => ({
	createQuestionRepository: () => repo,
}))

let nextId = 0
vi.mock('../../../worker/lib/ids', () => ({ createId: () => `id-${++nextId}` }))

const { createQuestionService } = await import('../../../worker/services/question-service')

const service = createQuestionService({} as never)

const input: QuestionInput = {
	title: 'Why does a linked list miss cache?',
	slug: 'linked-list-cache-miss',
	body: 'Think about the prefetcher.',
	type: 'single_choice',
	topicId: 'caches',
	difficulty: 'intermediate',
	options: ['Pointer chasing', 'Arrays are shorter'],
	correctAnswer: 'Pointer chasing',
}

function sha256(value: unknown) {
	return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function stored(overrides: Record<string, unknown> = {}) {
	return {
		id: 'q1',
		authorId: 'author-1',
		revision: 1,
		status: 'draft',
		submittedAt: null,
		approvedAt: null,
		publishedAt: null,
		subtopic: null,
		explanation: null,
		...input,
		...overrides,
	}
}

beforeEach(() => {
	vi.clearAllMocks()
	nextId = 0
	repo.update.mockImplementation(async (id: string, values: Record<string, unknown>) => [{ ...stored({ id }), ...values }])
	repo.create.mockImplementation(async (values: Record<string, unknown>) => [{ revision: 1, status: 'draft', ...values }])
	repo.upsertProgress.mockImplementation(async (values: unknown) => [values])
})

describe('list', () => {
	it('passes filters through to the repository', async () => {
		repo.findPage.mockResolvedValue({ items: [], total: 0 })
		await service.list({ page: 3, pageSize: 7, search: 'tlb', userId: 'u1', includeDrafts: true })
		expect(repo.findPage).toHaveBeenCalledWith({ page: 3, pageSize: 7, search: 'tlb', userId: 'u1', includeDrafts: true })
	})

	it('defaults page to 1 and pageSize to 20 when they are missing', async () => {
		repo.findPage.mockResolvedValue({ items: [], total: 0 })
		await service.list({} as never)
		expect(repo.findPage).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }))
	})

	it('returns what the repository returns', async () => {
		const page = { items: [stored()], total: 1 }
		repo.findPage.mockResolvedValue(page)
		await expect(service.list({ page: 1, pageSize: 20 })).resolves.toBe(page)
	})
})

describe('get', () => {
	it('looks the question up by id', async () => {
		repo.findById.mockResolvedValue(stored())
		await expect(service.get('q1')).resolves.toMatchObject({ id: 'q1' })
		expect(repo.findById).toHaveBeenCalledWith('q1')
	})

	it('returns undefined for an unknown id', async () => {
		repo.findById.mockResolvedValue(undefined)
		await expect(service.get('missing')).resolves.toBeUndefined()
	})
})

describe('create', () => {
	it('stores the question under a fresh id with the author', async () => {
		await service.create(input, 'author-1')
		expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ id: 'id-1', authorId: 'author-1', title: input.title }))
	})

	it('hashes the input with SHA-256', async () => {
		await service.create(input, 'author-1')
		expect(repo.create.mock.calls[0][0].contentHash).toBe(sha256(input))
	})

	it('produces a 64-character lowercase hex hash', async () => {
		await service.create(input, 'author-1')
		expect(repo.create.mock.calls[0][0].contentHash).toMatch(/^[0-9a-f]{64}$/)
	})

	it('gives different content different hashes', async () => {
		await service.create(input, 'a')
		await service.create({ ...input, body: 'Something else' }, 'a')
		expect(repo.create.mock.calls[0][0].contentHash).not.toBe(repo.create.mock.calls[1][0].contentHash)
	})

	it('normalises missing subtopic and explanation to null', async () => {
		await service.create(input, 'author-1')
		expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ subtopic: null, explanation: null }))
	})

	it('keeps a provided subtopic and explanation', async () => {
		await service.create({ ...input, subtopic: 'Prefetching', explanation: 'Because.' }, 'author-1')
		expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ subtopic: 'Prefetching', explanation: 'Because.' }))
	})

	it('writes a revision snapshot for the new question', async () => {
		await service.create(input, 'author-1')
		expect(repo.createRevision).toHaveBeenCalledTimes(1)
		expect(repo.createRevision).toHaveBeenCalledWith(expect.objectContaining({
			id: 'id-2',
			questionId: 'id-1',
			revision: 1,
			title: input.title,
			correctAnswer: input.correctAnswer,
			contentHash: sha256(input),
			createdBy: 'author-1',
		}))
	})

	it('returns the created row', async () => {
		await expect(service.create(input, 'author-1')).resolves.toMatchObject({ id: 'id-1', title: input.title })
	})

	it('skips the revision when the insert returns nothing', async () => {
		repo.create.mockResolvedValue([])
		await expect(service.create(input, 'author-1')).resolves.toBeUndefined()
		expect(repo.createRevision).not.toHaveBeenCalled()
	})

	it('propagates a repository failure', async () => {
		repo.create.mockRejectedValue(new Error('unique violation'))
		await expect(service.create(input, 'author-1')).rejects.toThrow('unique violation')
	})
})

describe('update', () => {
	it('returns null and writes nothing for an unknown question', async () => {
		repo.findById.mockResolvedValue(undefined)
		await expect(service.update('missing', input, 'u1')).resolves.toBeNull()
		expect(repo.update).not.toHaveBeenCalled()
		expect(repo.createRevision).not.toHaveBeenCalled()
	})

	it('bumps the revision number by one', async () => {
		repo.findById.mockResolvedValue(stored({ revision: 4 }))
		await service.update('q1', input, 'u1')
		expect(repo.update).toHaveBeenCalledWith('q1', expect.objectContaining({ revision: 5 }))
	})

	it('drops a published question back to draft', async () => {
		repo.findById.mockResolvedValue(stored({ status: 'published' }))
		await service.update('q1', input, 'u1')
		expect(repo.update).toHaveBeenCalledWith('q1', expect.objectContaining({ status: 'draft' }))
	})

	it.each(questionStatuses.filter((status) => status !== 'published'))('keeps a %s question in its status', async (status) => {
		repo.findById.mockResolvedValue(stored({ status }))
		await service.update('q1', input, 'u1')
		expect(repo.update).toHaveBeenCalledWith('q1', expect.objectContaining({ status }))
	})

	it('stamps updatedAt', async () => {
		repo.findById.mockResolvedValue(stored())
		await service.update('q1', input, 'u1')
		expect(repo.update.mock.calls[0][1].updatedAt).toBeInstanceOf(Date)
	})

	it('re-hashes the new content', async () => {
		repo.findById.mockResolvedValue(stored())
		const changed = { ...input, title: 'A new title' }
		await service.update('q1', changed, 'u1')
		expect(repo.update.mock.calls[0][1].contentHash).toBe(sha256(changed))
	})

	it('records the editor, not the original author, on the revision', async () => {
		repo.findById.mockResolvedValue(stored({ authorId: 'author-1' }))
		await service.update('q1', input, 'editor-9')
		expect(repo.createRevision).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 'editor-9', questionId: 'q1', revision: 2 }))
	})

	it('skips the revision when the update matches no row', async () => {
		repo.findById.mockResolvedValue(stored())
		repo.update.mockResolvedValue([])
		await expect(service.update('q1', input, 'u1')).resolves.toBeUndefined()
		expect(repo.createRevision).not.toHaveBeenCalled()
	})
})

describe('archive', () => {
	it('marks the question archived and stamps both dates', async () => {
		await service.archive('q1')
		const values = repo.update.mock.calls[0][1]
		expect(repo.update.mock.calls[0][0]).toBe('q1')
		expect(values.status).toBe('archived')
		expect(values.archivedAt).toBeInstanceOf(Date)
		expect(values.updatedAt).toBeInstanceOf(Date)
	})
})

describe('workflow transitions', () => {
	// The whole state machine, written out so any change to it is deliberate.
	const allowed: Record<string, { from: string[]; to: string }> = {
		submit: { from: ['draft', 'changes_requested', 'rejected'], to: 'submitted' },
		start_review: { from: ['submitted'], to: 'in_review' },
		request_changes: { from: ['in_review'], to: 'changes_requested' },
		reject: { from: ['in_review'], to: 'rejected' },
		approve: { from: ['in_review'], to: 'approved' },
		publish: { from: ['approved'], to: 'published' },
	}

	const matrix = Object.entries(allowed).flatMap(([action, rule]) =>
		questionStatuses.map((from) => ({ action, from, ok: rule.from.includes(from), to: rule.to })),
	)

	it.each(matrix.filter((row) => row.ok))('$action moves $from to $to', async ({ action, from, to }) => {
		repo.findById.mockResolvedValue(stored({ status: from }))
		const result = await service.transition('q1', action, 'actor-1')
		expect(result).toHaveProperty('item')
		expect(repo.update).toHaveBeenCalledWith('q1', expect.objectContaining({ status: to }))
		expect(repo.createWorkflowEvent).toHaveBeenCalledWith(expect.objectContaining({ questionId: 'q1', actorId: 'actor-1', fromStatus: from, toStatus: to }))
	})

	it.each(matrix.filter((row) => !row.ok))('$action refuses to move a $from question', async ({ action, from }) => {
		repo.findById.mockResolvedValue(stored({ status: from }))
		await expect(service.transition('q1', action, 'actor-1')).resolves.toEqual({ error: 'Invalid workflow transition' })
		expect(repo.update).not.toHaveBeenCalled()
		expect(repo.createWorkflowEvent).not.toHaveBeenCalled()
	})

	it('never lets an archived or published question move', async () => {
		for (const status of ['archived', 'published']) {
			for (const action of Object.keys(allowed)) {
				repo.findById.mockResolvedValue(stored({ status }))
				await expect(service.transition('q1', action, 'a')).resolves.toHaveProperty('error')
			}
		}
	})

	it('rejects an unknown action', async () => {
		repo.findById.mockResolvedValue(stored({ status: 'draft' }))
		await expect(service.transition('q1', 'teleport', 'a')).resolves.toEqual({ error: 'Invalid workflow transition' })
	})

	// KNOWN BUG: `transitions[action]` is a plain object lookup, so an inherited key such as
	// `toString` finds a function, `.from` is undefined, and the service throws (a 500) instead of
	// answering "Invalid workflow transition". Fix with `Object.hasOwn(transitions, action)`, then
	// turn these back into plain `it.each`.
	it.fails.each(['toString', 'constructor', '__proto__'])('does not treat the prototype key %s as an action', async (action) => {
		repo.findById.mockResolvedValue(stored({ status: 'draft' }))
		await expect(service.transition('q1', action, 'a')).resolves.toEqual({ error: 'Invalid workflow transition' })
		expect(repo.update).not.toHaveBeenCalled()
	})

	it('rejects a transition on a missing question', async () => {
		repo.findById.mockResolvedValue(undefined)
		await expect(service.transition('missing', 'submit', 'a')).resolves.toEqual({ error: 'Invalid workflow transition' })
	})

	it('stamps submittedAt on submit and keeps the other dates', async () => {
		const approvedAt = new Date('2026-01-01')
		repo.findById.mockResolvedValue(stored({ status: 'draft', approvedAt }))
		await service.transition('q1', 'submit', 'a')
		const values = repo.update.mock.calls[0][1]
		expect(values.submittedAt).toBeInstanceOf(Date)
		expect(values.approvedAt).toBe(approvedAt)
		expect(values.publishedAt).toBeNull()
	})

	it('keeps the original submittedAt on later transitions', async () => {
		const submittedAt = new Date('2026-02-02')
		repo.findById.mockResolvedValue(stored({ status: 'in_review', submittedAt }))
		await service.transition('q1', 'approve', 'a')
		const values = repo.update.mock.calls[0][1]
		expect(values.submittedAt).toBe(submittedAt)
		expect(values.approvedAt).toBeInstanceOf(Date)
	})

	it('stamps publishedAt on publish', async () => {
		repo.findById.mockResolvedValue(stored({ status: 'approved' }))
		await service.transition('q1', 'publish', 'a')
		expect(repo.update.mock.calls[0][1].publishedAt).toBeInstanceOf(Date)
	})

	it.each(['reject', 'request_changes'])('keeps the reason as rejectionReason on %s', async (action) => {
		repo.findById.mockResolvedValue(stored({ status: 'in_review' }))
		await service.transition('q1', action, 'a', 'Needs a diagram')
		expect(repo.update.mock.calls[0][1].rejectionReason).toBe('Needs a diagram')
		expect(repo.createWorkflowEvent.mock.calls[0][0].reason).toBe('Needs a diagram')
	})

	it.each(['reject', 'request_changes'])('stores a null rejectionReason when %s has no reason', async (action) => {
		repo.findById.mockResolvedValue(stored({ status: 'in_review' }))
		await service.transition('q1', action, 'a')
		expect(repo.update.mock.calls[0][1].rejectionReason).toBeNull()
	})

	it('clears rejectionReason on a non-rejecting transition even when a reason is given', async () => {
		repo.findById.mockResolvedValue(stored({ status: 'rejected', rejectionReason: 'old' }))
		await service.transition('q1', 'submit', 'a', 'fixed it')
		expect(repo.update.mock.calls[0][1].rejectionReason).toBeNull()
		expect(repo.createWorkflowEvent.mock.calls[0][0].reason).toBe('fixed it')
	})

	it('records the workflow event under a fresh id', async () => {
		repo.findById.mockResolvedValue(stored({ status: 'draft' }))
		await service.transition('q1', 'submit', 'a')
		expect(repo.createWorkflowEvent.mock.calls[0][0].id).toBe('id-1')
	})

	it('returns the updated row as item', async () => {
		repo.findById.mockResolvedValue(stored({ status: 'draft' }))
		const result = await service.transition('q1', 'submit', 'a')
		expect(result).toMatchObject({ item: { id: 'q1', status: 'submitted' } })
	})
})

describe('revisions and restore', () => {
	const snapshot = {
		title: 'Old title',
		body: 'Old body',
		type: 'true_false',
		topicId: 'caches',
		subtopic: 'TLB',
		difficulty: 'beginner',
		options: [],
		correctAnswer: 'true',
		explanation: 'Old explanation',
	}

	it('lists revisions for a question', async () => {
		repo.listRevisions.mockResolvedValue([{ revision: 1 }])
		await expect(service.revisions('q1')).resolves.toEqual([{ revision: 1 }])
		expect(repo.listRevisions).toHaveBeenCalledWith('q1')
	})

	it('returns null when the question is missing', async () => {
		repo.findById.mockResolvedValue(undefined)
		repo.findRevision.mockResolvedValue(snapshot)
		await expect(service.restore('q1', 1, 'a')).resolves.toBeNull()
		expect(repo.update).not.toHaveBeenCalled()
	})

	it('returns null when the revision is missing', async () => {
		repo.findById.mockResolvedValue(stored())
		repo.findRevision.mockResolvedValue(undefined)
		await expect(service.restore('q1', 99, 'a')).resolves.toBeNull()
		expect(repo.update).not.toHaveBeenCalled()
	})

	it('asks the repository for the exact revision', async () => {
		repo.findById.mockResolvedValue(stored())
		repo.findRevision.mockResolvedValue(snapshot)
		await service.restore('q1', 3, 'a')
		expect(repo.findRevision).toHaveBeenCalledWith('q1', 3)
	})

	it('copies the snapshot content back but keeps the current slug', async () => {
		repo.findById.mockResolvedValue(stored({ slug: 'current-slug', revision: 5 }))
		repo.findRevision.mockResolvedValue(snapshot)
		await service.restore('q1', 2, 'a')
		expect(repo.update).toHaveBeenCalledWith('q1', expect.objectContaining({ ...snapshot, slug: 'current-slug', revision: 6 }))
	})

	it('resets the workflow to a clean draft', async () => {
		repo.findById.mockResolvedValue(stored({ status: 'published', rejectionReason: 'x' }))
		repo.findRevision.mockResolvedValue(snapshot)
		await service.restore('q1', 1, 'a')
		expect(repo.update).toHaveBeenCalledWith('q1', expect.objectContaining({
			status: 'draft', submittedAt: null, approvedAt: null, publishedAt: null, rejectionReason: null,
		}))
	})

	it('writes a new revision attributed to whoever restored it', async () => {
		repo.findById.mockResolvedValue(stored({ revision: 5 }))
		repo.findRevision.mockResolvedValue(snapshot)
		await service.restore('q1', 2, 'restorer')
		expect(repo.createRevision).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 'restorer', revision: 6, title: 'Old title' }))
	})
})

describe('answer grading', () => {
	function publishedAs(type: string, correctAnswer: unknown, explanation: string | null = 'Because.') {
		repo.findById.mockResolvedValue(stored({ status: 'published', type, correctAnswer, explanation }))
		repo.findProgressForQuestion.mockResolvedValue(undefined)
	}

	it.each([
		['exact match', 'single_choice', 'Pointer chasing', 'Pointer chasing', true],
		['case differs', 'single_choice', 'Pointer chasing', 'POINTER CHASING', true],
		['surrounding whitespace', 'single_choice', 'Pointer chasing', '  Pointer chasing  ', true],
		['inner whitespace collapses', 'single_choice', 'Pointer chasing', 'Pointer    chasing', true],
		['tabs and newlines collapse', 'single_choice', 'Pointer chasing', 'Pointer\t\nchasing', true],
		['a different option', 'single_choice', 'Pointer chasing', 'Arrays are shorter', false],
		['a prefix only', 'single_choice', 'Pointer chasing', 'Pointer', false],
		['true/false true', 'true_false', 'true', 'TRUE', true],
		['true/false wrong', 'true_false', 'true', 'false', false],
		['math', 'math', '64', ' 64 ', true],
		['math wrong', 'math', '64', '65', false],
		['code output', 'code_output', 'hello world', 'Hello  World', true],
		['array submitted to a single answer', 'single_choice', 'Pointer chasing', ['Pointer chasing'], false],
		['string submitted to a multi answer', 'multiple_choice', ['a', 'b'], 'a', false],
		['multi, same order', 'multiple_choice', ['a', 'b'], ['a', 'b'], true],
		['multi, any order', 'multiple_choice', ['a', 'b'], ['b', 'a'], true],
		['multi, case and spacing', 'multiple_choice', ['Cache line'], [' cache   LINE '], true],
		['multi, one missing', 'multiple_choice', ['a', 'b'], ['a'], false],
		['multi, one extra', 'multiple_choice', ['a', 'b'], ['a', 'b', 'c'], false],
		['multi, empty', 'multiple_choice', ['a'], [], false],
		['multi, wrong item', 'multiple_choice', ['a', 'b'], ['a', 'c'], false],
		['multi expected stored as a string', 'multiple_choice', 'a', ['a'], false],
		['single expected stored as an array', 'single_choice', ['a'], 'a', false],
	])('%s', async (_label, type, expected, submitted, correct) => {
		publishedAs(type, expected)
		const result = await service.answer('q1', 'u1', { answer: submitted as string })
		expect(result).toMatchObject({ correct })
		expect(repo.createAttempt).toHaveBeenCalledWith(expect.objectContaining({ correct, answer: submitted, userId: 'u1', questionId: 'q1' }))
	})

	// Pinned current behaviour: the set comparison counts length, not distinct items,
	// so a duplicated right answer can stand in for a missing one.
	it('treats a duplicated correct option as covering a missing one', async () => {
		publishedAs('multiple_choice', ['a', 'b'])
		await expect(service.answer('q1', 'u1', { answer: ['a', 'a'] })).resolves.toMatchObject({ correct: true })
	})

	it.each(questionStatuses.filter((status) => status !== 'published'))('refuses to grade a %s question', async (status) => {
		repo.findById.mockResolvedValue(stored({ status }))
		await expect(service.answer('q1', 'u1', { answer: 'x' })).resolves.toEqual({ error: 'Question not found' })
		expect(repo.createAttempt).not.toHaveBeenCalled()
		expect(repo.upsertProgress).not.toHaveBeenCalled()
	})

	it('refuses to grade a missing question', async () => {
		repo.findById.mockResolvedValue(undefined)
		await expect(service.answer('q1', 'u1', { answer: 'x' })).resolves.toEqual({ error: 'Question not found' })
	})

	it('returns the explanation', async () => {
		publishedAs('single_choice', 'Pointer chasing', 'The prefetcher cannot follow pointers.')
		await expect(service.answer('q1', 'u1', { answer: 'nope' })).resolves.toMatchObject({ explanation: 'The prefetcher cannot follow pointers.' })
	})

	it('never returns the correct answer', async () => {
		publishedAs('single_choice', 'Pointer chasing')
		const result = await service.answer('q1', 'u1', { answer: 'nope' })
		expect(JSON.stringify(result)).not.toContain('Pointer chasing')
	})

	it('starts progress at one attempt for a first answer', async () => {
		publishedAs('single_choice', 'Pointer chasing')
		await service.answer('q1', 'u1', { answer: 'Pointer chasing' })
		expect(repo.upsertProgress).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', questionId: 'q1', attempts: 1, solved: true }))
		expect(repo.upsertProgress.mock.calls[0][0].solvedAt).toBeInstanceOf(Date)
	})

	it('leaves solvedAt null for a wrong first answer', async () => {
		publishedAs('single_choice', 'Pointer chasing')
		await service.answer('q1', 'u1', { answer: 'nope' })
		expect(repo.upsertProgress).toHaveBeenCalledWith(expect.objectContaining({ attempts: 1, solved: false, solvedAt: null }))
	})

	it('counts attempts up from previous progress', async () => {
		publishedAs('single_choice', 'Pointer chasing')
		repo.findProgressForQuestion.mockResolvedValue({ solved: false, attempts: 4, solvedAt: null })
		await service.answer('q1', 'u1', { answer: 'nope' })
		expect(repo.upsertProgress).toHaveBeenCalledWith(expect.objectContaining({ attempts: 5 }))
	})

	it('keeps solved sticky after a later wrong answer', async () => {
		const solvedAt = new Date('2026-03-03')
		publishedAs('single_choice', 'Pointer chasing')
		repo.findProgressForQuestion.mockResolvedValue({ solved: true, attempts: 2, solvedAt })
		const result = await service.answer('q1', 'u1', { answer: 'wrong' })
		expect(result).toMatchObject({ correct: false })
		expect(repo.upsertProgress).toHaveBeenCalledWith(expect.objectContaining({ solved: true, solvedAt, attempts: 3 }))
	})

	it('keeps the first solvedAt when solved again', async () => {
		const solvedAt = new Date('2026-03-03')
		publishedAs('single_choice', 'Pointer chasing')
		repo.findProgressForQuestion.mockResolvedValue({ solved: true, attempts: 1, solvedAt })
		await service.answer('q1', 'u1', { answer: 'Pointer chasing' })
		expect(repo.upsertProgress.mock.calls[0][0].solvedAt).toBe(solvedAt)
	})

	it('stamps lastAttemptAt with the attempt time', async () => {
		publishedAs('single_choice', 'Pointer chasing')
		await service.answer('q1', 'u1', { answer: 'x' })
		const attemptAt = repo.createAttempt.mock.calls[0][0].createdAt
		expect(repo.upsertProgress.mock.calls[0][0].lastAttemptAt).toBe(attemptAt)
	})

	it('returns the upserted progress row', async () => {
		publishedAs('single_choice', 'Pointer chasing')
		const result = await service.answer('q1', 'u1', { answer: 'Pointer chasing' })
		expect(result).toMatchObject({ progress: { attempts: 1, solved: true } })
	})
})

describe('progress passthroughs', () => {
	it('reads progress for a user', async () => {
		repo.findProgress.mockResolvedValue([{ solved: true }])
		await expect(service.progress('u1')).resolves.toEqual([{ solved: true }])
		expect(repo.findProgress).toHaveBeenCalledWith('u1')
	})

	it('reads attempt history for a user', async () => {
		repo.findAttempts.mockResolvedValue([])
		await service.history('u1')
		expect(repo.findAttempts).toHaveBeenCalledWith('u1')
	})

	it('reads topic counts with or without a user', async () => {
		repo.findTopicCounts.mockResolvedValue([])
		await service.topicCounts('u1')
		await service.topicCounts()
		expect(repo.findTopicCounts).toHaveBeenNthCalledWith(1, 'u1')
		expect(repo.findTopicCounts).toHaveBeenNthCalledWith(2, undefined)
	})
})
