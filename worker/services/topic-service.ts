import type { TopicInput } from '@low-level-lab/shared/content'

import { createId } from '../lib/ids.js'
import { createQuestionService } from './question-service.js'
import { createTopicRepository } from '../repositories/topic-repository.js'

export function createTopicService(db: Parameters<typeof createTopicRepository>[0]) {
	const repository = createTopicRepository(db)
	const questions = createQuestionService(db)

	return {
		async list(userId?: string) {
			const [topics, counts] = await Promise.all([repository.findActive(), questions.topicCounts(userId)])
			const byTopic = new Map(counts.map((item) => [item.topicId, { total: Number(item.total), solved: Number(item.solved) }]))
			return topics.map((item) => ({ ...item, ...(byTopic.get(item.id) ?? { total: 0, solved: 0 }) }))
		},
		async get(id: string, userId?: string, page = 1, pageSize = 20) {
			const item = await repository.findById(id)
			if (!item) return null
			const [result, counts] = await Promise.all([
				questions.list({ page, pageSize, topicId: id, userId }),
				questions.topicCounts(userId),
			])
			const count = counts.find((entry) => entry.topicId === id)
			const subtopics = [...new Set(result.items.map((question) => question.subtopic).filter(Boolean))]
			return { ...item, total: Number(count?.total ?? 0), solved: Number(count?.solved ?? 0), subtopics, questions: result.items }
		},
		getBySlug(slug: string) {
			return repository.findBySlug(slug)
		},
		create(input: TopicInput) {
			return repository.create({ id: createId(), ...input, description: input.description ?? null })
		},
		update(id: string, input: TopicInput) {
			return repository.update(id, { ...input, description: input.description ?? null, updatedAt: new Date() })
		},
		archive(id: string) {
			return repository.update(id, { archivedAt: new Date(), updatedAt: new Date() })
		},
	}
}
