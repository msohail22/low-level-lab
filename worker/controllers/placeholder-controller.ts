import { jsonResponse } from './request-utils.js'

export function socialPublishingPlaceholder() {
	return jsonResponse({
		error: 'Social publishing is intentionally not implemented.',
		boundary: 'Published questions remain in Low Level Lab; provider integrations require an opt-in outbox, idempotency keys, retries, and operator controls.',
	}, 501)
}

export function codingExecutionPlaceholder() {
	return jsonResponse({
		error: 'Coding-question execution is intentionally unavailable.',
		boundary: 'No code is executed or submitted until a sandbox, resource limits, isolation model, and abuse controls are approved.',
	}, 501)
}
