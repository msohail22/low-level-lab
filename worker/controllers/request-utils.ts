import { requirePermission } from '../authorization/openfga.js'

export function jsonResponse(data: unknown, status = 200) {
	return Response.json(data, { status })
}

export async function requireContentManager(request: Request, env: Env) {
	return requirePermission(request, env, 'manage_content')
}

export async function parseBody<T>(request: Request, schema: { safeParse: (body: unknown) => { success: true; data: T } | { success: false; error: unknown } }) {
	const body: unknown = await request.json()
	const result = schema.safeParse(body)

	if (!result.success) {
		return { error: jsonResponse({ error: 'Invalid request', issues: result.error }, 400) }
	}

	return { data: result.data }
}
