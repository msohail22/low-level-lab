import {
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	boolean,
} from 'drizzle-orm/pg-core'

import { user } from './auth-schema.js'

export const topic = pgTable('topic', {
	id: text('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull().unique(),
	description: text('description'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	archivedAt: timestamp('archived_at'),
})

export const question = pgTable('question', {
	id: text('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	type: text('type').notNull(),
	topicId: text('topic_id')
		.notNull()
		.references(() => topic.id, { onDelete: 'restrict' }),
	subtopic: text('subtopic'),
	difficulty: text('difficulty').notNull(),
	options: jsonb('options').$type<string[]>().notNull().default([]),
	correctAnswer: jsonb('correct_answer').notNull(),
	explanation: text('explanation'),
	status: text('status').notNull().default('draft'),
	revision: integer('revision').notNull().default(1),
	contentHash: text('content_hash').notNull().default(''),
	rejectionReason: text('rejection_reason'),
	authorId: text('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	archivedAt: timestamp('archived_at'),
	submittedAt: timestamp('submitted_at'),
	approvedAt: timestamp('approved_at'),
	publishedAt: timestamp('published_at'),
})

export const questionRevision = pgTable('question_revision', {
	id: text('id').primaryKey(),
	questionId: text('question_id').notNull().references(() => question.id, { onDelete: 'cascade' }),
	revision: integer('revision').notNull(),
	title: text('title').notNull(),
	body: text('body').notNull(),
	type: text('type').notNull(),
	topicId: text('topic_id').notNull().references(() => topic.id, { onDelete: 'restrict' }),
	subtopic: text('subtopic'),
	difficulty: text('difficulty').notNull(),
	options: jsonb('options').$type<string[]>().notNull(),
	correctAnswer: jsonb('correct_answer').notNull(),
	explanation: text('explanation'),
	contentHash: text('content_hash').notNull(),
	createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const questionWorkflowEvent = pgTable('question_workflow_event', {
	id: text('id').primaryKey(),
	questionId: text('question_id').notNull().references(() => question.id, { onDelete: 'cascade' }),
	actorId: text('actor_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
	fromStatus: text('from_status').notNull(),
	toStatus: text('to_status').notNull(),
	reason: text('reason'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const questionAttempt = pgTable('question_attempt', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	questionId: text('question_id').notNull().references(() => question.id, { onDelete: 'cascade' }),
	answer: jsonb('answer').notNull(),
	correct: boolean('correct').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const questionProgress = pgTable('question_progress', {
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	questionId: text('question_id').notNull().references(() => question.id, { onDelete: 'cascade' }),
	solved: boolean('solved').notNull().default(false),
	attempts: integer('attempts').notNull().default(0),
	lastAttemptAt: timestamp('last_attempt_at').notNull().defaultNow(),
	solvedAt: timestamp('solved_at'),
}, (table) => ({
	primaryKey: primaryKey({ columns: [table.userId, table.questionId] }),
}))

export const contentSchema = { topic, question, questionRevision, questionWorkflowEvent, questionAttempt, questionProgress }

export type ContentSchema = typeof contentSchema
