import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

import { user } from './auth-schema.js'
import { topic } from './content-schema.js'

export const userRole = pgTable(
	'user_role',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role').notNull(),
		topicId: text('topic_id').references(() => topic.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => ({
		userRoleUnique: unique().on(table.userId, table.role, table.topicId),
	}),
)

export const authorizationSchema = { userRole }

export type AuthorizationSchema = typeof authorizationSchema
