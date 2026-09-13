import { requireQuestionPermission } from '../authorization/openfga.js'
import { createDatabase } from '../db/client.js'
import { createQuestionService } from '../services/question-service.js'
import { jsonResponse } from './request-utils.js'

export async function handleSocialPublish(request: Request, env: Env, questionId?: string) {
	if (request.method !== 'POST' || !questionId) return jsonResponse({ error: 'Method not allowed' }, 405)
	const service = createQuestionService(createDatabase(env))
	const question = await service.get(questionId)
	if (!question || question.status !== 'published') return jsonResponse({ error: 'Published question not found' }, 404)
	const user = await requireQuestionPermission(request, env, 'publish_question', question)
	if (!user) return jsonResponse({ error: 'Publishing permission required' }, 403)
	if (!env.SOCIAL_PUBLISH_WEBHOOK_URL) return jsonResponse({ error: 'Social publishing is not configured' }, 503)

	const response = await fetch(env.SOCIAL_PUBLISH_WEBHOOK_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			event: 'question.published',
			question: {
				id: question.id,
				title: question.title,
				body: question.body,
				slug: question.slug,
				topicId: question.topicId,
			},
			actorId: user.id,
		}),
	})
	if (!response.ok) throw new Error(`Social publishing failed with status ${response.status}`)
	return jsonResponse({ published: true, questionId: question.id })
}
