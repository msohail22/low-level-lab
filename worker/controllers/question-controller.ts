import { asc, desc, eq } from 'drizzle-orm'

import { createDatabase } from '../db/client.js'
import { question } from '../db/schema.js'
import { questionInputSchema } from '../schemas/content.js'
import { createId, jsonResponse, parseBody, requireUser } from './request-utils.js'

export async function handleQuestionRequest(request: Request, env: Env, questionId?: string): Promise<Response> {
	const db = createDatabase(env)

	if (request.method === 'GET') {
		if (questionId) {
			const item = await db.query.question.findFirst({ where: eq(question.id, questionId) })
			return item ? jsonResponse(item) : jsonResponse({ error: 'Question not found' }, 404)
		}

		return jsonResponse(await db.query.question.findMany({
			where: eq(question.status, 'draft'),
			orderBy: [desc(question.updatedAt), asc(question.title)],
		}))
	}

	const user = await requireUser(request, env)
	if (!user) return jsonResponse({ error: 'Authentication required' }, 401)

	if (!questionId && request.method === 'POST') {
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [created] = await db.insert(question).values({
			id: createId(),
			authorId: user.id,
			...parsed.data,
		}).returning()
		return jsonResponse(created, 201)
	}

	if (questionId && request.method === 'PUT') {
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [updated] = await db.update(question).set({ ...parsed.data, updatedAt: new Date() }).where(eq(question.id, questionId)).returning()
		return updated ? jsonResponse(updated) : jsonResponse({ error: 'Question not found' }, 404)
	}

	if (questionId && request.method === 'DELETE') {
		const [archived] = await db.update(question).set({ status: 'archived', archivedAt: new Date(), updatedAt: new Date() }).where(eq(question.id, questionId)).returning()
		return archived ? jsonResponse(archived) : jsonResponse({ error: 'Question not found' }, 404)
	}

	return jsonResponse({ error: 'Method not allowed' }, 405)
}
