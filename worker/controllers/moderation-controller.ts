import { createDatabase } from '../db/client.js'
import { requirePermission } from '../authorization/openfga.js'
import { createQuestionService } from '../services/question-service.js'
import { jsonResponse } from './request-utils.js'

function publicQuestion(item: Record<string, unknown>) {
	const safe = { ...item }
	delete safe.correctAnswer
	delete safe.authorId
	return safe
}

export async function handleModerationRequest(request: Request, env: Env) {
	if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405)
	const url = new URL(request.url)
	const queue = url.pathname.split('/').filter(Boolean)[2] ?? url.searchParams.get('queue') ?? 'reviewer'
	const permission = queue === 'admin' ? 'approve_question' : 'review_question'
	const user = await requirePermission(request, env, permission)
	if (!user) return jsonResponse({ error: 'Moderation permission required' }, 403)
	const service = createQuestionService(createDatabase(env))
	const statuses: Array<'in_review' | 'approved' | 'submitted'> = queue === 'admin' ? ['in_review', 'approved'] : ['submitted', 'in_review']
	const items = (await Promise.all(statuses.map((status) => service.list({
		status,
		includeDrafts: true,
		page: 1,
		pageSize: 50,
		userId: user.id,
	})))).flatMap((result) => result.items)
	return jsonResponse({ items: items.map((item) => publicQuestion(item as unknown as Record<string, unknown>)), total: items.length })
}
