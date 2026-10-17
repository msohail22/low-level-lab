// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const topicRepo = {
	findActive: vi.fn(),
	findById: vi.fn(),
	findBySlug: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
}
const questions = {
	list: vi.fn(),
	topicCounts: vi.fn(),
}

vi.mock('../../../worker/repositories/topic-repository', () => ({ createTopicRepository: () => topicRepo }))
vi.mock('../../../worker/services/question-service', () => ({ createQuestionService: () => questions }))
vi.mock('../../../worker/lib/ids', () => ({ createId: () => 'new-id' }))

const { createTopicService } = await import('../../../worker/services/topic-service')
const service = createTopicService({} as never)

const caches = { id: 'caches', slug: 'caches', name: 'Caches', description: null }
const memory = { id: 'memory', slug: 'memory', name: 'Memory', description: 'Pages' }

beforeEach(() => {
	vi.clearAllMocks()
	questions.list.mockResolvedValue({ items: [], total: 0 })
	questions.topicCounts.mockResolvedValue([])
})

describe('list', () => {
	it('merges counts onto each active topic', async () => {
		topicRepo.findActive.mockResolvedValue([caches, memory])
		questions.topicCounts.mockResolvedValue([{ topicId: 'caches', total: 5, solved: 2 }])
		await expect(service.list('u1')).resolves.toEqual([
			{ ...caches, total: 5, solved: 2 },
			{ ...memory, total: 0, solved: 0 },
		])
	})

	it('coerces string counts from Postgres into numbers', async () => {
		topicRepo.findActive.mockResolvedValue([caches])
		questions.topicCounts.mockResolvedValue([{ topicId: 'caches', total: '12', solved: '3' }])
		const [topic] = await service.list()
		expect(topic.total).toBe(12)
		expect(topic.solved).toBe(3)
	})

	it('ignores counts for topics that are not active', async () => {
		topicRepo.findActive.mockResolvedValue([caches])
		questions.topicCounts.mockResolvedValue([{ topicId: 'archived', total: 9, solved: 9 }])
		await expect(service.list()).resolves.toEqual([{ ...caches, total: 0, solved: 0 }])
	})

	it('returns an empty list when there are no topics', async () => {
		topicRepo.findActive.mockResolvedValue([])
		await expect(service.list()).resolves.toEqual([])
	})

	it('scopes the counts to the user', async () => {
		topicRepo.findActive.mockResolvedValue([])
		await service.list('u1')
		expect(questions.topicCounts).toHaveBeenCalledWith('u1')
	})
})

describe('get', () => {
	it('returns null for an unknown topic without loading questions', async () => {
		topicRepo.findById.mockResolvedValue(undefined)
		await expect(service.get('missing')).resolves.toBeNull()
		expect(questions.list).not.toHaveBeenCalled()
	})

	it('loads the page of questions for that topic', async () => {
		topicRepo.findById.mockResolvedValue(caches)
		await service.get('caches', 'u1', 2, 5)
		expect(questions.list).toHaveBeenCalledWith({ page: 2, pageSize: 5, topicId: 'caches', userId: 'u1' })
	})

	it('defaults to page 1 of 20', async () => {
		topicRepo.findById.mockResolvedValue(caches)
		await service.get('caches')
		expect(questions.list).toHaveBeenCalledWith({ page: 1, pageSize: 20, topicId: 'caches', userId: undefined })
	})

	it('adds totals, questions and the distinct subtopics', async () => {
		topicRepo.findById.mockResolvedValue(caches)
		const items = [
			{ id: 'q1', subtopic: 'TLB' },
			{ id: 'q2', subtopic: 'Prefetching' },
			{ id: 'q3', subtopic: 'TLB' },
			{ id: 'q4', subtopic: null },
			{ id: 'q5', subtopic: '' },
		]
		questions.list.mockResolvedValue({ items, total: 5 })
		questions.topicCounts.mockResolvedValue([{ topicId: 'memory', total: 1, solved: 1 }, { topicId: 'caches', total: '5', solved: '1' }])
		await expect(service.get('caches')).resolves.toEqual({
			...caches, total: 5, solved: 1, subtopics: ['TLB', 'Prefetching'], questions: items,
		})
	})

	it('reports zero counts when the topic has none yet', async () => {
		topicRepo.findById.mockResolvedValue(caches)
		const topic = await service.get('caches')
		expect(topic).toMatchObject({ total: 0, solved: 0, subtopics: [], questions: [] })
	})
})

describe('writes', () => {
	it('looks topics up by slug', async () => {
		topicRepo.findBySlug.mockResolvedValue(caches)
		await expect(service.getBySlug('caches')).resolves.toBe(caches)
		expect(topicRepo.findBySlug).toHaveBeenCalledWith('caches')
	})

	it('creates a topic under a fresh id with a null description by default', async () => {
		await service.create({ name: 'Caches', slug: 'caches' })
		expect(topicRepo.create).toHaveBeenCalledWith({ id: 'new-id', name: 'Caches', slug: 'caches', description: null })
	})

	it('keeps a provided description', async () => {
		await service.create({ name: 'Caches', slug: 'caches', description: 'Lines and sets' })
		expect(topicRepo.create).toHaveBeenCalledWith(expect.objectContaining({ description: 'Lines and sets' }))
	})

	it('updates a topic and stamps updatedAt', async () => {
		await service.update('caches', { name: 'Caches 2', slug: 'caches' })
		const [id, values] = topicRepo.update.mock.calls[0]
		expect(id).toBe('caches')
		expect(values).toMatchObject({ name: 'Caches 2', description: null })
		expect(values.updatedAt).toBeInstanceOf(Date)
	})

	it('archives by stamping archivedAt rather than deleting', async () => {
		await service.archive('caches')
		const [id, values] = topicRepo.update.mock.calls[0]
		expect(id).toBe('caches')
		expect(values.archivedAt).toBeInstanceOf(Date)
		expect(values.updatedAt).toBeInstanceOf(Date)
	})
})
