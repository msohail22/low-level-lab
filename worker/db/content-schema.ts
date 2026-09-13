import {
	jsonb,
	pgTable,
	text,
	timestamp,
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
	authorId: text('author_id')
		.notNull()
		.references(() => user.id, { onDelete: 'restrict' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	archivedAt: timestamp('archived_at'),
})

export const contentSchema = { topic, question }

export type ContentSchema = typeof contentSchema
