import { topicInputSchema } from '@low-level-lab/shared/content'

import { getAuthenticatedUser } from '../authorization/openfga.js'
import { createDatabase } from '../db/client.js'
import { createTopicService } from '../services/topic-service.js'
import { jsonResponse, parseBody, requirePermissionFor } from './request-utils.js'

export async function handleTopicRequest(request: Request, env: Env, topicId?: string): Promise<Response> {
	const service = createTopicService(createDatabase(env))
	const url = new URL(request.url)
	const sessionUser = await getAuthenticatedUser(request, env)

	if (request.method === 'GET') {
		const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
		const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') ?? 20)))
		const item = topicId ? await service.get(topicId, sessionUser?.id, page, pageSize) : await service.list(sessionUser?.id)
		if (!item) return jsonResponse({ error: 'Topic not found' }, 404)
		if (topicId && 'questions' in item) {
			const { questions, ...topic } = item
			return jsonResponse({ ...topic, questions: questions.map((question) => {
				const safe = { ...(question as unknown as Record<string, unknown>) }
				delete safe.correctAnswer
				delete safe.authorId
				return safe
			}) })
		}
		return jsonResponse(item)
	}

	const user = await requirePermissionFor(request, env, 'manage_topics', topicId)
	if (!user) return jsonResponse({ error: 'Content management permission required' }, 403)

	if (!topicId && request.method === 'POST') {
		const parsed = await parseBody(request, topicInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [created] = await service.create(parsed.data)
		return jsonResponse(created, 201)
	}

	if (topicId && request.method === 'PUT') {
		const parsed = await parseBody(request, topicInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [updated] = await service.update(topicId, parsed.data)
		return updated ? jsonResponse(updated) : jsonResponse({ error: 'Topic not found' }, 404)
	}

	if (topicId && request.method === 'DELETE') {
		const [archived] = await service.archive(topicId)
		return archived ? jsonResponse(archived) : jsonResponse({ error: 'Topic not found' }, 404)
	}

	return jsonResponse({ error: 'Method not allowed' }, 405)
}
