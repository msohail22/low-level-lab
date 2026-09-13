import { answerSubmissionSchema, questionInputSchema, questionSearchSchema, workflowTransitionSchema } from '@low-level-lab/shared/content'

import { createDatabase } from '../db/client.js'
import { createQuestionService } from '../services/question-service.js'
import { requireQuestionPermission } from '../authorization/authorization.js'
import { jsonResponse, parseBody, requirePermissionFor } from './request-utils.js'

function publicQuestion(item: Record<string, unknown>) {
	const safe = { ...item }
	delete safe.correctAnswer
	delete safe.authorId
	return safe
}

export async function handleQuestionRequest(request: Request, env: Env, questionId?: string, action?: string): Promise<Response> {
	const service = createQuestionService(createDatabase(env))
	const url = new URL(request.url)

	if (request.method === 'GET') {
		if (action === 'revisions' && questionId) {
			const existing = await service.get(questionId)
			const user = existing ? await requireQuestionPermission(request, env, 'edit_question', existing) : null
			return user ? jsonResponse(await service.revisions(questionId)) : jsonResponse({ error: 'Question permission required' }, 403)
		}
		if (questionId) {
			const item = await service.get(questionId)
			if (!item || item.status !== 'published') return jsonResponse({ error: 'Question not found' }, 404)
			return jsonResponse(publicQuestion(item as unknown as Record<string, unknown>))
		}
		const manage = url.searchParams.get('manage') === '1'
		const user = manage ? await requirePermissionFor(request, env, 'create_question') : null
		if (manage && !user) return jsonResponse({ error: 'Question management permission required' }, 403)
		const parsed = questionSearchSchema.safeParse(Object.fromEntries(url.searchParams))
		if (!parsed.success) return jsonResponse({ error: 'Invalid search filters' }, 400)
		const currentUser = await (async () => {
			const sessionUser = await requirePermissionFor(request, env, 'create_question')
			return sessionUser?.id
		})()
		const result = await service.list({ ...parsed.data, includeDrafts: manage, userId: currentUser })
		return jsonResponse({ ...result, items: result.items.map((item) => publicQuestion(item as unknown as Record<string, unknown>)) })
	}

	if (questionId && request.method === 'POST' && action === 'answer') {
		const user = await requirePermissionFor(request, env, 'create_question')
		if (!user) return jsonResponse({ error: 'Sign in to submit an answer' }, 401)
		const parsed = await parseBody(request, answerSubmissionSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid answer' }, 400)
		const result = await service.answer(questionId, user.id, parsed.data)
		return 'error' in result ? jsonResponse(result, 404) : jsonResponse(result)
	}

	if (action && questionId) {
		const existing = await service.get(questionId)
		if (!existing) return jsonResponse({ error: 'Question not found' }, 404)
		const permission = action === 'submit' ? 'submit_question' : action === 'approve' ? 'approve_question' : action === 'publish' ? 'publish_question' : 'review_question'
		const user = await requireQuestionPermission(request, env, permission, existing)
		if (!user) return jsonResponse({ error: 'Question workflow permission required' }, 403)
		const parsed = await parseBody(request, workflowTransitionSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const result = await service.transition(questionId, action as 'submit' | 'start_review' | 'request_changes' | 'reject' | 'approve' | 'publish', user.id, parsed.data.reason)
		return 'error' in result ? jsonResponse(result, 409) : jsonResponse(result.item)
	}

	if (!questionId && request.method === 'POST') {
		const user = await requirePermissionFor(request, env, 'create_question')
		if (!user) return jsonResponse({ error: 'Question submission permission required' }, 403)
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const created = await service.create(parsed.data, user.id)
		return jsonResponse(created, 201)
	}

	const existing = questionId ? await service.get(questionId) : null
	const user = existing
		? await requireQuestionPermission(request, env, 'edit_question', existing)
		: null
	if (!user) return jsonResponse({ error: 'Question edit permission required' }, 403)

	if (questionId && request.method === 'PUT') {
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid request' }, 400)
		const updated = await service.update(questionId, parsed.data, user.id)
		return updated ? jsonResponse(updated) : jsonResponse({ error: 'Question not found' }, 404)
	}

	if (questionId && request.method === 'DELETE') {
		const [archived] = await service.archive(questionId)
		return archived ? jsonResponse(archived) : jsonResponse({ error: 'Question not found' }, 404)
	}

	return jsonResponse({ error: 'Method not allowed' }, 405)
}
