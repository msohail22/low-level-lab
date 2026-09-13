import { and, asc, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'

import type { createDatabase } from '../db/client.js'
import { question, questionAttempt, questionProgress, questionRevision, questionWorkflowEvent, topic } from '../db/content-schema.js'

type Database = ReturnType<typeof createDatabase>

export type QuestionListFilters = {
	search?: string
	topicId?: string
	subtopic?: string
	type?: string
	status?: string
	page: number
	pageSize: number
	userId?: string
	includeDrafts?: boolean
}

export function createQuestionRepository(db: Database) {
	return {
		findPage(filters: QuestionListFilters) {
			const conditions = [
				isNull(question.archivedAt),
				filters.includeDrafts ? undefined : eq(question.status, 'published'),
				filters.topicId ? eq(question.topicId, filters.topicId) : undefined,
				filters.subtopic ? eq(question.subtopic, filters.subtopic) : undefined,
				filters.type ? eq(question.type, filters.type) : undefined,
				filters.search
					? or(
						sql`to_tsvector('english', ${question.title} || ' ' || ${question.body}) @@ plainto_tsquery('english', ${filters.search})`,
						ilike(question.title, `%${filters.search}%`),
						ilike(question.body, `%${filters.search}%`),
						ilike(question.subtopic, `%${filters.search}%`),
						sql`exists (select 1 from ${topic} t where t.id = ${question.topicId} and t.name ilike ${`%${filters.search}%`})`,
					)
					: undefined,
				filters.status === 'solved' && filters.userId
					? sql`exists (select 1 from question_progress qp where qp.question_id = ${question.id} and qp.user_id = ${filters.userId} and qp.solved = true)`
					: undefined,
				filters.status === 'unsolved' && filters.userId
					? sql`not exists (select 1 from question_progress qp where qp.question_id = ${question.id} and qp.user_id = ${filters.userId} and qp.solved = true)`
					: undefined,
			].filter(Boolean)
			const where = and(...conditions)
			const offset = (filters.page - 1) * filters.pageSize
			const solved = filters.userId
				? sql<boolean>`exists (select 1 from question_progress qp where qp.question_id = ${question.id} and qp.user_id = ${filters.userId} and qp.solved = true)`
				: sql<boolean>`false`
			return Promise.all([
				db.select({ item: question, solved }).from(question).where(where).orderBy(desc(question.updatedAt), asc(question.title)).limit(filters.pageSize).offset(offset),
				db.select({ total: count() }).from(question).where(where),
			]).then(([items, totals]) => ({ items: items.map(({ item, solved: isSolved }) => ({ ...item, solved: Boolean(isSolved) })), total: Number(totals[0]?.total ?? 0) }))
		},
		findById(id: string) {
			return db.query.question.findFirst({ where: eq(question.id, id) })
		},
		findDrafts() {
			return db.query.question.findMany({
				where: and(isNull(question.archivedAt), eq(question.status, 'draft')),
				orderBy: [desc(question.updatedAt), asc(question.title)],
			})
		},
		create(values: typeof question.$inferInsert) {
			return db.insert(question).values(values).returning()
		},
		update(id: string, values: Partial<typeof question.$inferInsert>) {
			return db.update(question).set(values).where(eq(question.id, id)).returning()
		},
		createRevision(values: typeof questionRevision.$inferInsert) {
			return db.insert(questionRevision).values(values).returning()
		},
		listRevisions(questionId: string) {
			return db.select().from(questionRevision).where(eq(questionRevision.questionId, questionId)).orderBy(desc(questionRevision.revision))
		},
		createWorkflowEvent(values: typeof questionWorkflowEvent.$inferInsert) {
			return db.insert(questionWorkflowEvent).values(values).returning()
		},
		createAttempt(values: typeof questionAttempt.$inferInsert) {
			return db.insert(questionAttempt).values(values).returning()
		},
		upsertProgress(values: typeof questionProgress.$inferInsert) {
			return db.insert(questionProgress).values(values).onConflictDoUpdate({
				target: [questionProgress.userId, questionProgress.questionId],
				set: values,
			}).returning()
		},
		findProgress(userId: string) {
			return db.select().from(questionProgress).where(eq(questionProgress.userId, userId))
		},
		findProgressForQuestion(userId: string, questionId: string) {
			return db.query.questionProgress.findFirst({
				where: and(eq(questionProgress.userId, userId), eq(questionProgress.questionId, questionId)),
			})
		},
		findTopicCounts(userId?: string) {
			const solvedSql = userId
				? sql<number>`count(*) filter (where exists (select 1 from question_progress qp where qp.question_id = ${question.id} and qp.user_id = ${userId} and qp.solved = true))`
				: sql<number>`0`
			return db.select({
				topicId: question.topicId,
				total: count(),
				solved: solvedSql,
			}).from(question).where(eq(question.status, 'published')).groupBy(question.topicId)
		},
	}
}
