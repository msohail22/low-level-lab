import { topicInputSchema } from '@low-level-lab/shared/content'

import { createDatabase } from '../db/client.js'
import { createTopicService } from '../services/topic-service.js'
import { jsonResponse, parseBody, requireUser } from './request-utils.js'

export async function handleTopicRequest(request: Request, env: Env, topicId?: string): Promise<Response> {
	const service = createTopicService(createDatabase(env))

	if (request.method === 'GET') {
		const item = topicId ? await service.get(topicId) : await service.list()
		return item ? jsonResponse(item) : jsonResponse({ error: 'Topic not found' }, 404)
	}

	const user = await requireUser(request, env)
	if (!user) return jsonResponse({ error: 'Authentication required' }, 401)

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
