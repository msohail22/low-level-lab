// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The dispatch in worker/index.ts is hand-rolled and positional, so every route is written down
// here with the exact arguments its controller receives.

const ok = (name: string) => vi.fn(async () => Response.json({ handledBy: name }))
const controllers = {
	handleQuestionRequest: ok('questions'),
	handleProgressRequest: ok('progress'),
	codingExecutionPlaceholder: ok('execute'),
	handleSocialPublish: ok('social'),
	handleTopicRequest: ok('topics'),
	handleAuthorizationRequest: ok('roles'),
	handleModerationRequest: ok('moderation'),
}
const authHandler = vi.fn(async () => Response.json({ handledBy: 'auth' }))
const closeDatabases = vi.fn(async () => {})
const send = vi.fn()
const ResendCtor = vi.fn()

vi.mock('../../../worker/controllers/question-controller', () => ({ handleQuestionRequest: controllers.handleQuestionRequest }))
vi.mock('../../../worker/controllers/progress-controller', () => ({ handleProgressRequest: controllers.handleProgressRequest }))
vi.mock('../../../worker/controllers/placeholder-controller', () => ({ codingExecutionPlaceholder: controllers.codingExecutionPlaceholder }))
vi.mock('../../../worker/controllers/social-controller', () => ({ handleSocialPublish: controllers.handleSocialPublish }))
vi.mock('../../../worker/controllers/topic-controller', () => ({ handleTopicRequest: controllers.handleTopicRequest }))
vi.mock('../../../worker/controllers/authorization-controller', () => ({ handleAuthorizationRequest: controllers.handleAuthorizationRequest }))
vi.mock('../../../worker/controllers/moderation-controller', () => ({ handleModerationRequest: controllers.handleModerationRequest }))
vi.mock('../../../worker/auth', () => ({ createAuth: () => ({ handler: authHandler }) }))
vi.mock('../../../worker/db/client', () => ({ closeDatabases }))
vi.mock('resend', () => ({
	Resend: class {
		emails = { send }
		constructor(key: string) { ResendCtor(key) }
	},
}))

const worker = (await import('../../../worker/index')).default

const env = { RESEND_API_KEY: 're_test', RESEND_FROM_EMAIL: 'lab@example.com' }

function ctx() {
	return { waitUntil: vi.fn(), passThroughOnException: vi.fn(), props: {} }
}

async function hit(path: string, method = 'GET') {
	const context = ctx()
	const response = await worker.fetch!(new Request(`https://lab.example${path}`, { method }) as never, env as never, context as never)
	return { response, context, body: response.status === 404 && !response.headers.get('content-type') ? null : await response.json() }
}

beforeEach(() => {
	vi.clearAllMocks()
	vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('fetch dispatch', () => {
	it.each([
		['/api/auth/sign-in/email', 'auth'],
		['/api/auth/get-session', 'auth'],
		['/api/topics', 'topics'],
		['/api/topics/caches', 'topics'],
		['/api/progress', 'progress'],
		['/api/progress/history', 'progress'],
		['/api/admin/roles', 'roles'],
		['/api/moderation', 'moderation'],
		['/api/moderation/admin', 'moderation'],
		['/api/social/publish/q1', 'social'],
		['/api/questions/q1/execute', 'execute'],
		['/api/anything/execute', 'execute'],
		['/api/questions', 'questions'],
		['/api/questions/q1', 'questions'],
		['/api/questions/q1/answer', 'questions'],
	])('%s goes to %s', async (path, name) => {
		const { body } = await hit(path)
		expect(body).toEqual({ handledBy: name })
	})

	it('hands the topic id from the third segment', async () => {
		await hit('/api/topics/caches')
		expect(controllers.handleTopicRequest).toHaveBeenCalledWith(expect.any(Request), env, 'caches')
	})

	it('hands no topic id for the collection', async () => {
		await hit('/api/topics')
		expect(controllers.handleTopicRequest).toHaveBeenCalledWith(expect.any(Request), env, undefined)
	})

	it('hands the question id and action', async () => {
		await hit('/api/questions/q1/approve', 'POST')
		expect(controllers.handleQuestionRequest).toHaveBeenCalledWith(expect.any(Request), env, 'q1', 'approve')
	})

	it('hands only the id for a plain question route', async () => {
		await hit('/api/questions/q1')
		expect(controllers.handleQuestionRequest).toHaveBeenCalledWith(expect.any(Request), env, 'q1', undefined)
	})

	it('tolerates a trailing slash on a question route', async () => {
		await hit('/api/questions/q1/')
		expect(controllers.handleQuestionRequest).toHaveBeenCalledWith(expect.any(Request), env, 'q1', undefined)
	})

	it('hands the social question id', async () => {
		await hit('/api/social/publish/q7', 'POST')
		expect(controllers.handleSocialPublish).toHaveBeenCalledWith(expect.any(Request), env, 'q7')
	})

	it('only routes the exact roles path', async () => {
		const { body } = await hit('/api/admin/roles/extra')
		expect(body).toEqual({ name: 'Cloudflare' })
		expect(controllers.handleAuthorizationRequest).not.toHaveBeenCalled()
	})

	it('answers an unknown /api/ path with the default payload', async () => {
		const { response, body } = await hit('/api/unknown')
		expect(response.status).toBe(200)
		expect(body).toEqual({ name: 'Cloudflare' })
	})

	it.each(['/', '/questions', '/favicon.ico', '/apiary'])('404s the non-API path %s', async (path) => {
		const { response } = await hit(path)
		expect(response.status).toBe(404)
	})

	it('turns a thrown controller error into a JSON 500', async () => {
		controllers.handleQuestionRequest.mockRejectedValueOnce(new Error('pool exhausted'))
		const { response, body } = await hit('/api/questions')
		expect(response.status).toBe(500)
		expect(body).toEqual({ error: 'Internal Server Error', message: 'pool exhausted' })
		expect(console.error).toHaveBeenCalled()
	})

	it('reports a non-Error throw as a string', async () => {
		controllers.handleTopicRequest.mockRejectedValueOnce('plain string')
		const { body } = await hit('/api/topics')
		expect(body.message).toBe('plain string')
	})

	it('closes the request databases on success', async () => {
		const { context } = await hit('/api/topics')
		expect(context.waitUntil).toHaveBeenCalledTimes(1)
		expect(closeDatabases).toHaveBeenCalledTimes(1)
	})

	it('closes the request databases on failure too', async () => {
		controllers.handleTopicRequest.mockRejectedValueOnce(new Error('x'))
		const { context } = await hit('/api/topics')
		expect(context.waitUntil).toHaveBeenCalledTimes(1)
		expect(closeDatabases).toHaveBeenCalledTimes(1)
	})

	it('closes the request databases for a 404 as well', async () => {
		const { context } = await hit('/nothing')
		expect(context.waitUntil).toHaveBeenCalledTimes(1)
	})
})

describe('auth email queue consumer', () => {
	function message(body: unknown) {
		return { body, ack: vi.fn(), retry: vi.fn() }
	}

	async function consume(...messages: ReturnType<typeof message>[]) {
		await worker.queue!({ messages } as never, env as never, ctx() as never)
	}

	beforeEach(() => send.mockResolvedValue({ error: null }))

	it('builds the client from the API key', async () => {
		await consume()
		expect(ResendCtor).toHaveBeenCalledWith('re_test')
	})

	it('sends a verification email', async () => {
		await consume(message({ type: 'email-verification', to: 'a@b.c', url: 'https://lab.example/verify?t=1' }))
		expect(send).toHaveBeenCalledWith({
			from: 'lab@example.com',
			to: 'a@b.c',
			subject: 'Verify your Low Level Lab email',
			html: expect.stringContaining('href="https://lab.example/verify?t=1"'),
		})
		expect(send.mock.calls[0][0].html).toContain('Verify email')
	})

	it('sends a password reset email', async () => {
		await consume(message({ type: 'password-reset', to: 'a@b.c', url: 'https://lab.example/reset' }))
		expect(send).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Reset your Low Level Lab password' }))
		expect(send.mock.calls[0][0].html).toContain('Reset password')
	})

	it('sends one email per message', async () => {
		await consume(
			message({ type: 'password-reset', to: 'a@b.c', url: 'u1' }),
			message({ type: 'email-verification', to: 'd@e.f', url: 'u2' }),
		)
		expect(send).toHaveBeenCalledTimes(2)
	})

	it.each([
		['null', null],
		['a string', 'hello'],
		['an unknown type', { type: 'welcome', to: 'a@b.c', url: 'u' }],
		['a missing recipient', { type: 'password-reset', url: 'u' }],
		['a numeric url', { type: 'password-reset', to: 'a@b.c', url: 42 }],
	])('acks and skips %s without sending', async (_label, body) => {
		const bad = message(body)
		await consume(bad)
		expect(bad.ack).toHaveBeenCalled()
		expect(send).not.toHaveBeenCalled()
	})

	it('never logs the message body of a skipped message', async () => {
		await consume(message({ type: 'welcome', to: 'private@example.com', url: 'secret-token' }))
		expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private@example.com')
	})

	it('throws when Resend reports an error, so the batch is retried', async () => {
		send.mockResolvedValue({ error: { message: 'domain not verified' } })
		await expect(consume(message({ type: 'email-verification', to: 'a@b.c', url: 'u' })))
			.rejects.toThrow('Resend verification email failed: domain not verified')
	})

	it('names the password reset in its error', async () => {
		send.mockResolvedValue({ error: { message: 'rate limited' } })
		await expect(consume(message({ type: 'password-reset', to: 'a@b.c', url: 'u' })))
			.rejects.toThrow('Resend password reset email failed: rate limited')
	})
})
