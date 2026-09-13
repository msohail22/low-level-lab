import { createAuth } from '../auth.js'

export function createId() {
	return crypto.randomUUID()
}

export function jsonResponse(data: unknown, status = 200) {
	return Response.json(data, { status })
}

export async function requireUser(request: Request, env: Env) {
	const session = await createAuth(env, request).api.getSession({
		headers: request.headers,
	})
	return session?.user ?? null
}

export async function parseBody<T>(request: Request, schema: { safeParse: (body: unknown) => { success: true; data: T } | { success: false; error: unknown } }) {
	const body: unknown = await request.json()
	const result = schema.safeParse(body)

	if (!result.success) {
		return { error: jsonResponse({ error: 'Invalid request', issues: result.error }, 400) }
	}

	return { data: result.data }
}
