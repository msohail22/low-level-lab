import { and, eq, isNull, or } from 'drizzle-orm'

import type { createDatabase } from '../db/client.js'
import { userRole } from '../db/authorization-schema.js'

type Database = ReturnType<typeof createDatabase>

export function createAuthorizationRepository(db: Database) {
	return {
		findRoles(userId: string, topicId?: string) {
			return db
				.select()
				.from(userRole)
				.where(
					and(
						eq(userRole.userId, userId),
						topicId
							? or(isNull(userRole.topicId), eq(userRole.topicId, topicId))
							: isNull(userRole.topicId),
					),
				)
		},
	}
}
