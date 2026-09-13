import { createAuth } from '../auth.js'

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

type OpenFgaCheckResponse = { allowed?: boolean }

let accessToken: { value: string; expiresAt: number } | undefined

function isLocal(env: Env) {
	return env.OPENFGA_AUTH_MODE === 'local'
}

async function getAccessToken(env: Env) {
	if (isLocal(env)) return null
	if (accessToken && accessToken.expiresAt > Date.now() + 30_000) return accessToken.value

	const issuer = env.OPENFGA_TOKEN_ISSUER.startsWith('http')
		? env.OPENFGA_TOKEN_ISSUER
		: `https://${env.OPENFGA_TOKEN_ISSUER}`
	const response = await fetch(`${issuer}/oauth/token`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: env.OPENFGA_CLIENT_ID,
			client_secret: env.OPENFGA_CLIENT_SECRET,
			audience: env.OPENFGA_AUDIENCE,
		}),
	})

	if (!response.ok) throw new Error(`OpenFGA token request failed with status ${response.status}`)
	const result = (await response.json()) as { access_token?: string; expires_in?: number }
	if (!result.access_token) throw new Error('OpenFGA token response did not include an access token')

	accessToken = {
		value: result.access_token,
		expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000,
	}
	return result.access_token
}

async function check(env: Env, user: string, relation: Permission, object: string) {
	const token = await getAccessToken(env)
	const response = await fetch(`${env.OPENFGA_API_URL}/stores/${env.OPENFGA_STORE_ID}/check`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			user,
			relation,
			object,
			authorization_model_id: env.OPENFGA_MODEL_ID,
		}),
	})

	if (!response.ok) throw new Error(`OpenFGA permission check failed with status ${response.status}`)
	return Boolean((await response.json() as OpenFgaCheckResponse).allowed)
}

function objectForPermission(permission: Permission, topicId?: string, questionId?: string) {
	if (questionId && ['edit_question', 'submit_question', 'review_question', 'approve_question', 'publish_question'].includes(permission)) {
		return `question:${questionId}`
	}
	if (topicId && ['manage_topics', 'review_question', 'approve_question'].includes(permission)) {
		return `topic:${topicId}`
	}
	return 'organization:low-level-lab'
}

export async function getAuthenticatedUser(request: Request, env: Env) {
	const session = await createAuth(env, request).api.getSession({ headers: request.headers })
	return session?.user ?? null
}

export async function requirePermission(
	request: Request,
	env: Env,
	permission: Permission,
	topicId?: string,
	questionId?: string,
) {
	const user = await getAuthenticatedUser(request, env)
	if (!user) return null
	const allowed = await check(
		env,
		`user:${user.id}`,
		permission,
		objectForPermission(permission, topicId, questionId),
	)
	return allowed ? user : null
}

export async function requireQuestionPermission(
	request: Request,
	env: Env,
	permission: Permission,
	question: { id: string; topicId: string },
) {
	return requirePermission(request, env, permission, question.topicId, question.id)
}
