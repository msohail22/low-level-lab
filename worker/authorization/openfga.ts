import { createAuth } from '../auth.js'

type Permission = 'manage_content'

type OpenFgaCheckResponse = {
	allowed?: boolean
}

export async function requirePermission(
	request: Request,
	env: Env,
	permission: Permission,
) {
	const session = await createAuth(env, request).api.getSession({
		headers: request.headers,
	})
	if (!session?.user) return null

	if (!env.OPENFGA_API_URL || !env.OPENFGA_STORE_ID || !env.OPENFGA_MODEL_ID) {
		return session.user
	}

	const response = await fetch(
		`${env.OPENFGA_API_URL}/stores/${env.OPENFGA_STORE_ID}/check`,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				...(env.OPENFGA_API_TOKEN
					? { authorization: `Bearer ${env.OPENFGA_API_TOKEN}` }
					: {}),
			},
			body: JSON.stringify({
				user: `user:${session.user.id}`,
				relation: permission,
				object: 'content:catalog',
				model_id: env.OPENFGA_MODEL_ID,
			}),
		},
	)

	if (!response.ok) {
		throw new Error(`OpenFGA permission check failed with status ${response.status}`)
	}

	const result = (await response.json()) as OpenFgaCheckResponse
	return result.allowed ? session.user : null
}
