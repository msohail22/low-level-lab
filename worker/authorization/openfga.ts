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
export type Role = 'super_admin' | 'admin' | 'reviewer' | 'member'
type OpenFgaTuple = { user: string; relation: string; object: string }
type OpenFgaCheckResponse = { allowed?: boolean }
type OpenFgaTupleResponse = { tuples?: OpenFgaTuple[] }

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
	const result = await response.json() as { access_token?: string; expires_in?: number }
	if (!result.access_token) throw new Error('OpenFGA token response did not include an access token')
	accessToken = {
		value: result.access_token,
		expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000,
	}
	return result.access_token
}

async function check(env: Env, user: string, relation: Permission, object: string) {
	if (isLocal(env)) return false
	const token = await getAccessToken(env)
	const response = await fetch(`${env.OPENFGA_API_URL}/stores/${env.OPENFGA_STORE_ID}/check`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ user, relation, object, authorization_model_id: env.OPENFGA_MODEL_ID }),
	})
	if (!response.ok) throw new Error(`OpenFGA permission check failed with status ${response.status}`)
	return Boolean((await response.json() as OpenFgaCheckResponse).allowed)
}

async function writeTuples(env: Env, writes: OpenFgaTuple[], deletes: OpenFgaTuple[] = []) {
	if (isLocal(env)) throw new Error('OpenFGA tuple writes are disabled in local authorization mode')
	if (writes.length === 0 && deletes.length === 0) throw new Error('At least one tuple operation is required')
	const token = await getAccessToken(env)
	const response = await fetch(`${env.OPENFGA_API_URL}/stores/${env.OPENFGA_STORE_ID}/write`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			writes: writes.length ? { tuple_keys: writes } : undefined,
			deletes: deletes.length ? { tuple_keys: deletes } : undefined,
			authorization_model_id: env.OPENFGA_MODEL_ID,
		}),
	})
	if (!response.ok) throw new Error(`OpenFGA tuple write failed with status ${response.status}`)
}

async function readTuples(env: Env, object?: string) {
	if (isLocal(env)) return []
	const token = await getAccessToken(env)
	const url = `${env.OPENFGA_API_URL}/stores/${env.OPENFGA_STORE_ID}/read`
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ tuple_key: object ? { object } : undefined }),
	})
	if (!response.ok) throw new Error(`OpenFGA tuple read failed with status ${response.status}`)
	return (await response.json() as OpenFgaTupleResponse).tuples ?? []
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
	try {
		const session = await createAuth(env, request).api.getSession({ headers: request.headers })
		return session?.user ?? null
	} catch {
		return null
	}
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
	try {
		const allowed = await check(env, `user:${user.id}`, permission, objectForPermission(permission, topicId, questionId))
		return allowed ? user : null
	} catch {
		return null
	}
}

export async function requireQuestionPermission(
	request: Request,
	env: Env,
	permission: Permission,
	question: { id: string; topicId: string },
) {
	return requirePermission(request, env, permission, question.topicId, question.id)
}

export async function manageRoleTuple(
	env: Env,
	input: { userId: string; role: Role; organizationId?: string; topicId?: string },
	action: 'add' | 'remove',
) {
	const object = input.topicId ? `topic:${input.topicId}` : `organization:${input.organizationId ?? 'low-level-lab'}`
	const tuple = { user: `user:${input.userId}`, relation: input.role, object }
	await writeTuples(env, action === 'add' ? [tuple] : [], action === 'remove' ? [tuple] : [])
	return tuple
}

export async function listRoleTuples(env: Env, organizationId = 'low-level-lab') {
	return readTuples(env, `organization:${organizationId}`)
}
