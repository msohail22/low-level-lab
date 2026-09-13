import type { TopicInput } from '@low-level-lab/shared/content'

import { createId } from '../lib/ids.js'
import { createTopicRepository } from '../repositories/topic-repository.js'

export function createTopicService(db: Parameters<typeof createTopicRepository>[0]) {
	const repository = createTopicRepository(db)

	return {
		list() {
			return repository.findActive()
		},
		get(id: string) {
			return repository.findById(id)
		},
		create(input: TopicInput) {
			return repository.create({ id: createId(), ...input })
		},
		update(id: string, input: TopicInput) {
			return repository.update(id, { ...input, updatedAt: new Date() })
		},
		archive(id: string) {
			return repository.update(id, { archivedAt: new Date(), updatedAt: new Date() })
		},
	}
}
