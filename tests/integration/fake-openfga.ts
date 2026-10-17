/**
 * An in-memory OpenFGA that evaluates openfga/model.fga as written.
 *
 * It serves the four endpoints worker/authorization/openfga.ts calls (token, check, write, read)
 * so the Worker's real authorization code runs unchanged. The model below is a transcription of
 * openfga/model.fga — keep the two in step. Every term is either a direct relation on the object
 * (`['admin']`) or a relation reached through a tupleset (`['admin', 'organization']`, i.e.
 * "admin from organization").
 */

type Tuple = { user: string; relation: string; object: string }
type Term = [relation: string] | [relation: string, via: string]

const model: Record<string, Record<string, Term[]>> = {
	organization: {
		can_manage_users: [['super_admin']],
		can_assign_roles: [['super_admin']],
		can_manage_topics: [['super_admin'], ['admin']],
		can_create_question: [['super_admin'], ['admin'], ['reviewer'], ['member']],
		can_submit_question: [['super_admin'], ['member']],
		can_review_question: [['super_admin'], ['reviewer']],
		can_approve_question: [['super_admin'], ['admin']],
		can_publish_question: [['super_admin']],
	},
	topic: {
		can_manage_topics: [['admin'], ['super_admin', 'organization']],
		can_review_question: [['reviewer'], ['reviewer', 'organization'], ['super_admin', 'organization']],
		can_approve_question: [['admin'], ['admin', 'organization'], ['super_admin', 'organization']],
	},
	question: {
		can_edit_question: [['author'], ['super_admin', 'organization']],
		can_submit_question: [['author'], ['member', 'organization']],
		can_review_question: [['reviewer', 'topic'], ['reviewer', 'organization'], ['super_admin', 'organization']],
		can_approve_question: [['admin', 'topic'], ['admin', 'organization'], ['super_admin', 'organization']],
		can_publish_question: [['super_admin', 'organization']],
	},
}

export const FGA_URL = 'https://fga.test'
export const FGA_ISSUER = 'https://issuer.test'

export function createFakeOpenFga() {
	let tuples: Tuple[] = []
	const checks: Array<Tuple & { allowed: boolean }> = []
	let outage = false
	/**
	 * The Worker sends bare relation names (`create_question`) while the model declares
	 * `can_create_question`. A real OpenFGA holding this model would answer 400 to every check.
	 * `strictRelationNames` reproduces that; by default the fake maps bare names onto `can_*` so the
	 * rest of the flow can be tested while that mismatch is open (see CLAUDE.md "To do").
	 */
	let strictRelationNames = false

	function has(user: string, relation: string, object: string) {
		return tuples.some((tuple) => tuple.user === user && tuple.relation === relation && tuple.object === object)
	}

	function evaluate(user: string, relation: string, object: string): boolean | 'unknown_relation' {
		const permission = relation.startsWith('can_') || strictRelationNames ? relation : `can_${relation}`
		const terms = model[object.split(':')[0]]?.[permission]
		if (!terms) return 'unknown_relation'
		return terms.some(([rel, via]) => via
			? tuples.some((link) => link.object === object && link.relation === via && has(user, rel, link.user))
			: has(user, rel, object))
	}

	async function handle(url: string, init: RequestInit = {}) {
		if (outage) return new Response('unavailable', { status: 503 })

		if (url === `${FGA_ISSUER}/oauth/token`) {
			const form = new URLSearchParams(String(init.body))
			if (form.get('grant_type') !== 'client_credentials' || !form.get('client_secret')) return new Response('bad grant', { status: 401 })
			return Response.json({ access_token: 'fake-token', expires_in: 3600 })
		}

		const body = init.body ? JSON.parse(String(init.body)) : {}

		const auth = (init.headers as Record<string, string> | undefined)?.authorization
		if (auth !== 'Bearer fake-token') return new Response('unauthenticated', { status: 401 })

		if (url.endsWith('/check')) {
			const result = evaluate(body.user, body.relation, body.object)
			if (result === 'unknown_relation') return Response.json({ code: 'validation_error' }, { status: 400 })
			checks.push({ user: body.user, relation: body.relation, object: body.object, allowed: result })
			return Response.json({ allowed: result })
		}
		if (url.endsWith('/write')) {
			for (const tuple of body.writes?.tuple_keys ?? []) if (!has(tuple.user, tuple.relation, tuple.object)) tuples.push(tuple)
			for (const tuple of body.deletes?.tuple_keys ?? []) {
				tuples = tuples.filter((t) => !(t.user === tuple.user && t.relation === tuple.relation && t.object === tuple.object))
			}
			return Response.json({})
		}
		if (url.endsWith('/read')) {
			const object = body.tuple_key?.object
			return Response.json({ tuples: tuples.filter((tuple) => !object || tuple.object === object) })
		}
		return new Response('not found', { status: 404 })
	}

	return {
		handle,
		tuples: () => [...tuples],
		checks,
		grant(user: string, relation: string, object = 'organization:low-level-lab') {
			if (!has(`user:${user}`, relation, object)) tuples.push({ user: `user:${user}`, relation, object })
		},
		/** The tuples a question needs for its question-level permissions to resolve at all. */
		linkQuestion(questionId: string, authorId: string, topicId: string) {
			tuples.push(
				{ user: `user:${authorId}`, relation: 'author', object: `question:${questionId}` },
				{ user: 'organization:low-level-lab', relation: 'organization', object: `question:${questionId}` },
				{ user: `topic:${topicId}`, relation: 'topic', object: `question:${questionId}` },
			)
		},
		linkTopic(topicId: string) {
			tuples.push({ user: 'organization:low-level-lab', relation: 'organization', object: `topic:${topicId}` })
		},
		setOutage(value: boolean) { outage = value },
		setStrictRelationNames(value: boolean) { strictRelationNames = value },
		reset() {
			tuples = []
			checks.length = 0
			outage = false
			strictRelationNames = false
		},
	}
}
