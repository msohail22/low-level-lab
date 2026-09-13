import { requirePermission, type Permission } from '../authorization/openfga.js'

export function jsonResponse(data: unknown, status = 200) {
	return Response.json(data, { status })
}

export async function requireContentManager(request: Request, env: Env) {
	return requirePermission(request, env, 'manage_topics')
}

export async function requirePermissionFor(
	request: Request,
	env: Env,
	permission: Permission,
	topicId?: string,
) {
	return requirePermission(request, env, permission, topicId)
}

export async function parseBody<T>(request: Request, schema: { safeParse: (body: unknown) => { success: true; data: T } | { success: false; error: unknown } }) {
	const body: unknown = await request.json()
	const result = schema.safeParse(body)

	if (!result.success) {
		return { error: jsonResponse({ error: 'Invalid request', issues: result.error }, 400) }
	}

	return { data: result.data }
}
