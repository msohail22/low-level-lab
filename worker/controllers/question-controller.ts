import { questionInputSchema } from '@low-level-lab/shared/content'

import { createDatabase } from '../db/client.js'
import { createQuestionService } from '../services/question-service.js'
import { jsonResponse, parseBody, requireContentManager } from './request-utils.js'

export async function handleQuestionRequest(request: Request, env: Env, questionId?: string): Promise<Response> {
	const service = createQuestionService(createDatabase(env))

	if (request.method === 'GET') {
		const item = questionId ? await service.get(questionId) : await service.list()
		return item ? jsonResponse(item) : jsonResponse({ error: 'Question not found' }, 404)
	}

	const user = await requireContentManager(request, env)
	if (!user) return jsonResponse({ error: 'Content management permission required' }, 403)

	if (!questionId && request.method === 'POST') {
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [created] = await service.create(parsed.data, user.id)
		return jsonResponse(created, 201)
	}

	if (questionId && request.method === 'PUT') {
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const [updated] = await service.update(questionId, parsed.data)
		return updated ? jsonResponse(updated) : jsonResponse({ error: 'Question not found' }, 404)
	}

	if (questionId && request.method === 'DELETE') {
		const [archived] = await service.archive(questionId)
		return archived ? jsonResponse(archived) : jsonResponse({ error: 'Question not found' }, 404)
	}

	return jsonResponse({ error: 'Method not allowed' }, 405)
}
