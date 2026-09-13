import { jsonResponse } from './request-utils.js'

export function codingExecutionPlaceholder() {
	return jsonResponse({
		error: 'Coding-question execution is intentionally unavailable.',
		boundary: 'No code is executed or submitted until a sandbox, resource limits, isolation model, and abuse controls are approved.',
	}, 501)
}
