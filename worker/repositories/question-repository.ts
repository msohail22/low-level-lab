import { asc, desc, eq } from 'drizzle-orm'

import type { createDatabase } from '../db/client.js'
import { question } from '../db/content-schema.js'

type Database = ReturnType<typeof createDatabase>

export function createQuestionRepository(db: Database) {
	return {
		findDrafts() {
			return db.query.question.findMany({
				where: eq(question.status, 'draft'),
				orderBy: [desc(question.updatedAt), asc(question.title)],
			})
		},
		findById(id: string) {
			return db.query.question.findFirst({ where: eq(question.id, id) })
		},
		create(values: typeof question.$inferInsert) {
			return db.insert(question).values(values).returning()
		},
		update(id: string, values: Partial<typeof question.$inferInsert>) {
			return db.update(question).set(values).where(eq(question.id, id)).returning()
		},
	}
}
