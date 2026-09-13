import type { QuestionInput } from '@low-level-lab/shared/content'

import { createId } from '../lib/ids.js'
import { createQuestionRepository } from '../repositories/question-repository.js'

export function createQuestionService(db: Parameters<typeof createQuestionRepository>[0]) {
	const repository = createQuestionRepository(db)

	return {
		list() {
			return repository.findDrafts()
		},
		get(id: string) {
			return repository.findById(id)
		},
		create(input: QuestionInput, authorId: string) {
			return repository.create({ id: createId(), authorId, ...input })
		},
		update(id: string, input: QuestionInput) {
			return repository.update(id, { ...input, updatedAt: new Date() })
		},
		archive(id: string) {
			return repository.update(id, { status: 'archived', archivedAt: new Date(), updatedAt: new Date() })
		},
	}
}
