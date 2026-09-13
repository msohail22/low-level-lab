import { asc, eq, isNull } from 'drizzle-orm'

import { createDatabase } from '../db/client.js'
import { topic } from '../db/schema.js'
import { topicInputSchema } from '../schemas/content.js'
import { createId, jsonResponse, parseBody, requireUser } from './request-utils.js'

export async function handleTopicRequest(request: Request, env: Env, topicId?: string): Promise<Response> {
	const db = createDatabase(env)

	if (request.method === 'GET') {
		if (topicId) {
			const item = await db.query.topic.findFirst({ where: eq(topic.id, topicId) })
			return item ? jsonResponse(item) : jsonResponse({ error: 'Topic not found' }, 404)
		}

		return jsonResponse(await db.query.topic.findMany({
			where: isNull(topic.archivedAt),
			orderBy: asc(topic.name),
		}))
	}

	const user = await requireUser(request, env)
	if (!user) return jsonResponse({ error: 'Authentication required' }, 401)

	if (!topicId && request.method === 'POST') {
		const parsed = await parseBody(request, topicInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [created] = await db.insert(topic).values({ id: createId(), ...parsed.data }).returning()
		return jsonResponse(created, 201)
	}

	if (topicId && request.method === 'PUT') {
		const parsed = await parseBody(request, topicInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [updated] = await db.update(topic).set({ ...parsed.data, updatedAt: new Date() }).where(eq(topic.id, topicId)).returning()
		return updated ? jsonResponse(updated) : jsonResponse({ error: 'Topic not found' }, 404)
	}

	if (topicId && request.method === 'DELETE') {
		const [archived] = await db.update(topic).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(topic.id, topicId)).returning()
		return archived ? jsonResponse(archived) : jsonResponse({ error: 'Topic not found' }, 404)
	}

	return jsonResponse({ error: 'Method not allowed' }, 405)
}
