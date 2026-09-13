import { createAuth } from '../auth.js'
import { createDatabase } from '../db/client.js'
import { createAuthorizationRepository } from '../repositories/authorization-repository.js'

export const permissions = [
	'create_question',
	'edit_question',
	'submit_question',
	'review_question',
	'approve_question',
	'publish_question',
	'manage_topics',
	'manage_users',
] as const

export type Permission = (typeof permissions)[number]
export type Role = 'super_admin' | 'admin' | 'reviewer' | 'member'

export async function getAuthenticatedUser(request: Request, env: Env) {
	const session = await createAuth(env, request).api.getSession({
		headers: request.headers,
	})
	return session?.user ?? null
}

export async function requirePermission(
	request: Request,
	env: Env,
	permission: Permission,
	topicId?: string,
) {
	const user = await getAuthenticatedUser(request, env)
	if (!user) return null

	const repository = createAuthorizationRepository(createDatabase(env))
	const assignments = await repository.findRoles(user.id, topicId)
	const roles = new Set(assignments.map((assignment) => assignment.role as Role))

	if (roles.has('super_admin')) return user
	if (permission === 'create_question' || permission === 'submit_question') return user
	if (permission === 'review_question' && roles.has('reviewer')) return user
	if ((permission === 'approve_question' || permission === 'publish_question') && roles.has('admin')) return user
	if (permission === 'manage_topics' && roles.has('admin')) return user
	if (permission === 'manage_users') return null

	return null
}

export async function requireQuestionPermission(
	request: Request,
	env: Env,
	permission: Permission,
	question: { authorId: string; topicId: string; status: string },
) {
	const user = await getAuthenticatedUser(request, env)
	if (!user) return null

	const repository = createAuthorizationRepository(createDatabase(env))
	const assignments = await repository.findRoles(user.id, question.topicId)
	const roles = new Set(assignments.map((assignment) => assignment.role as Role))

	if (roles.has('super_admin')) return user
	if (permission === 'edit_question' && user.id === question.authorId && question.status !== 'published') {
		return user
	}
	if (permission === 'submit_question' && user.id === question.authorId && ['draft', 'changes_requested', 'rejected'].includes(question.status)) {
		return user
	}
	if (permission === 'review_question' && roles.has('reviewer')) return user
	if ((permission === 'approve_question' || permission === 'publish_question') && roles.has('admin')) return user

	return null
}
