import { getAuthenticatedUser } from '../authorization/openfga.js'
import { createDatabase } from '../db/client.js'
import { createQuestionService } from '../services/question-service.js'
import { jsonResponse } from './request-utils.js'

export async function handleProgressRequest(request: Request, env: Env) {
	const user = await getAuthenticatedUser(request, env)
	if (!user) return jsonResponse({ error: 'Sign in to view progress' }, 401)
	const service = createQuestionService(createDatabase(env))
	const [progress, topicCounts] = await Promise.all([
		service.progress(user.id),
		service.topicCounts(user.id),
	])
	const solved = progress.filter((item) => item.solved).length
	const total = topicCounts.reduce((sum, item) => sum + Number(item.total), 0)
	return jsonResponse({ solved, total, topics: topicCounts })
}
