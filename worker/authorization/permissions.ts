import { createAuth } from '../auth.js'

/**
 * Authorization, currently session-only.
 *
 * OpenFGA has been removed on purpose: the credentials were rejected in
 * production, no question or topic tuples were ever written, and the relation
 * names in `openfga/model.fga` did not match what the Worker sent. Every check
 * therefore failed closed and all content management was dead.
 *
 * The rule while it is gone: **a valid session is the permission**. Any signed-in
 * user may do anything a `Permission` names. Anonymous requests still get `null`,
 * so every caller keeps failing closed exactly as before.
 *
 * This is deliberately the only file that decides. The signatures below are
 * unchanged, so re-adding a real permission system means editing this file and
 * nothing else — `permissions` is kept as the list of decisions that will need
 * backing again.
 */
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
	try {
		const session = await createAuth(env, request).api.getSession({ headers: request.headers })
		return session?.user ?? null
	} catch {
		return null
	}
}

/**
 * The permission, topic and question arguments are accepted but not consulted
 * while authorization is session-only. They are kept so call sites already say
 * which decision they are making when a real check returns here.
 */
export async function requirePermission(
	request: Request,
	env: Env,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	permission: Permission,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	topicId?: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	questionId?: string,
) {
	return getAuthenticatedUser(request, env)
}

export async function requireQuestionPermission(
	request: Request,
	env: Env,
	permission: Permission,
	question: { id: string; topicId: string },
) {
	return requirePermission(request, env, permission, question.topicId, question.id)
}
