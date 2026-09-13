import { asc, eq, isNull } from 'drizzle-orm'

import type { createDatabase } from '../db/client.js'
import { topic } from '../db/content-schema.js'

type Database = ReturnType<typeof createDatabase>

export function createTopicRepository(db: Database) {
	return {
		findActive() {
			return db.query.topic.findMany({
				where: isNull(topic.archivedAt),
				orderBy: asc(topic.name),
			})
		},
		findById(id: string) {
			return db.query.topic.findFirst({ where: eq(topic.id, id) })
		},
		findBySlug(slug: string) {
			return db.query.topic.findFirst({ where: eq(topic.slug, slug) })
		},
		create(values: typeof topic.$inferInsert) {
			return db.insert(topic).values(values).returning()
		},
		update(id: string, values: Partial<typeof topic.$inferInsert>) {
			return db.update(topic).set(values).where(eq(topic.id, id)).returning()
		},
	}
}
