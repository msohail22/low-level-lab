import { roleAssignmentSchema } from '../../types.js'

import { listRoleTuples, manageRoleTuple, requirePermission } from '../authorization/openfga.js'
import { jsonResponse, parseBody } from './request-utils.js'

export async function handleAuthorizationRequest(request: Request, env: Env) {
	const actor = await requirePermission(request, env, 'manage_users')
	if (!actor) return jsonResponse({ error: 'Super-admin permission required' }, 403)

	if (request.method === 'GET') {
		try {
			return jsonResponse({ items: await listRoleTuples(env) })
		} catch {
			return jsonResponse({ error: 'Authorization service unavailable' }, 503)
		}
	}

	if (request.method !== 'POST' && request.method !== 'DELETE') {
		return jsonResponse({ error: 'Method not allowed' }, 405)
	}
	const parsed = await parseBody(request, roleAssignmentSchema)
	if ('error' in parsed) return parsed.error ?? jsonResponse({ error: 'Invalid role assignment' }, 400)
	try {
		const tuple = await manageRoleTuple(env, parsed.data, request.method === 'POST' ? 'add' : 'remove')
		return jsonResponse({ item: tuple })
	} catch {
		return jsonResponse({ error: 'Authorization service unavailable' }, 503)
	}
}
