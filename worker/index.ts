import { Hono } from 'hono'

import { createAuth } from './auth.js'
import { closeDatabases } from './db/client.js'
import { handleQuestionRequest } from './controllers/question-controller.js'
import { handleProgressRequest } from './controllers/progress-controller.js'
import { codingExecutionPlaceholder } from './controllers/placeholder-controller.js'
import { handleSocialPublish } from './controllers/social-controller.js'
import { handleTopicRequest } from './controllers/topic-controller.js'
import { handleAuthorizationRequest } from './controllers/authorization-controller.js'
import { handleModerationRequest } from './controllers/moderation-controller.js'
import { Resend } from 'resend'

/**
 * The API, as a Hono app.
 *
 * Hono replaces the hand-rolled `URL.pathname` dispatch this file used to carry. The win
 * is that a path parameter is now named rather than counted: `/api/questions/:id/:action`
 * instead of `segments[2]` and `segments[3]`, which shifted silently whenever a prefix
 * changed.
 *
 * Hono is used ONLY for routing. Controllers keep their existing
 * `(request: Request, env: Env, ...)` signature and are handed `c.req.raw` — the real
 * `Request`, unwrapped — so validation, permissions and response shaping are untouched by
 * this change. Do not start passing a Hono `Context` into a controller; the controller
 * layer has no business knowing which router called it.
 *
 * `handleProgressRequest` and `handleModerationRequest` read their own sub-path back off
 * the request URL (`/history`, and the moderation queue name). That keeps working because
 * they get the raw request, but it does mean their routes must match the deeper paths too
 * — hence the optional trailing segment on each rather than a bare prefix.
 *
 * Everything below was verified against hono 4.13.7 rather than assumed; the surprises
 * are recorded where they bite.
 */
const app = new Hono<{ Bindings: Env }>()

/**
 * The coding-execution placeholder, kept as a pre-router check because that is the only
 * way to reproduce what it did before: a bare `pathname.endsWith('/execute')`, matching
 * any depth and any prefix.
 *
 * It cannot be written as a route. A wildcard segment followed by `/execute` matches
 * NOTHING, because a mid-path `*` in Hono spans exactly one segment and so never reaches
 * an `/execute` sitting at depth three. A `*` middleware runs even for an unmatched path,
 * which is what keeps `/api/anything/execute` working alongside
 * `/api/questions/q1/execute`.
 */
app.use('*', async (c, next) => {
	if (new URL(c.req.url).pathname.endsWith('/execute')) return codingExecutionPlaceholder()
	await next()
})

app.all('/api/auth/*', async (c) => {
	const auth = createAuth(c.env, c.req.raw)
	return await auth.handler(c.req.raw)
})

app.all('/api/topics/:topicId?', async (c) => handleTopicRequest(c.req.raw, c.env, c.req.param('topicId')))

app.all('/api/progress/:section?', async (c) => handleProgressRequest(c.req.raw, c.env))

app.all('/api/admin/roles', async (c) => handleAuthorizationRequest(c.req.raw, c.env))

app.all('/api/moderation/:queue?', async (c) => handleModerationRequest(c.req.raw, c.env))

app.all('/api/social/publish/:questionId', async (c) =>
	handleSocialPublish(c.req.raw, c.env, c.req.param('questionId')),
)

// Chained optional segments resolve as expected, so one route covers `/api/questions`,
// `/api/questions/:id` and `/api/questions/:id/:action`.
app.all('/api/questions/:questionId?/:action?', async (c) =>
	handleQuestionRequest(c.req.raw, c.env, c.req.param('questionId'), c.req.param('action')),
)

app.all('/api/*', (c) => c.json({ name: 'Cloudflare' }))

// Anything that is not an API path is served by the static assets binding, so the Worker
// answering it at all means the asset router already gave up on it.
app.notFound(() => new Response(null, { status: 404 }))

/**
 * The JSON 500 the API has always answered with. An API client parses every response body
 * as JSON, so a failure has to stay JSON too.
 *
 * It is reachable two ways, and both are needed:
 *   - `app.onError`, for a thrown `Error`. Without it Hono's built-in handler answers
 *     with the plain text "Internal Server Error", which a client cannot parse.
 *   - the `catch` in `fetch` below, for a throw that is NOT an `Error` instance. Hono
 *     never routes those to `onError`; they propagate straight out of `app.fetch`.
 */
function internalError(error: unknown): Response {
	console.error('Unhandled Worker Exception:', error)
	return Response.json(
		{
			error: 'Internal Server Error',
			message: error instanceof Error ? error.message : String(error),
		},
		{ status: 500 },
	)
}

app.onError((error) => internalError(error))

/**
 * Strip one trailing slash before the router sees the URL, so `/api/questions/q1/` routes
 * as `/api/questions/q1` rather than falling through to the `/api/*` default.
 *
 * This is done here and not with Hono's own `trimTrailingSlash()` middleware, which
 * answers with a 301 redirect. A redirect is wrong for an API: it would turn one POST
 * into a client-visible round trip, and non-GET redirects are not reliably followed with
 * their method and body intact.
 */
function withoutTrailingSlash(request: Request): Request {
	const url = new URL(request.url)
	if (url.pathname.length <= 1 || !url.pathname.endsWith('/')) return request

	url.pathname = url.pathname.replace(/\/+$/, '')
	return new Request(url, request)
}

type EmailMessage = {
	type: 'password-reset' | 'email-verification'
	to: string
	url: string
}

function isEmailMessage(value: unknown): value is EmailMessage {
	if (!value || typeof value !== 'object') {
		return false
	}

	const message = value as Record<string, unknown>
	return (
		(message.type === 'password-reset' ||
			message.type === 'email-verification') &&
		typeof message.to === 'string' &&
		typeof message.url === 'string'
	)
}

export default {
	async fetch(request, env, ctx) {
		try {
			// `await` here is load-bearing. Returning the promise instead would run the
			// `finally` block before any handler had finished, and `closeDatabases()`
			// would then tear down the pool out from under the request still using it.
			return await app.fetch(withoutTrailingSlash(request), env, ctx)
		} catch (error) {
			// Only a non-`Error` throw reaches here; see `internalError` above.
			return internalError(error)
		} finally {
			// Release this request's connections; never carry a socket into the next one.
			ctx.waitUntil(closeDatabases())
		}
	},
	async queue(batch, env) {
		const resend = new Resend(env.RESEND_API_KEY)

		for (const message of batch.messages) {
			if (!isEmailMessage(message.body)) {
				console.error('Ignoring unsupported auth email queue message')
				message.ack()
				continue
			}

			const payload = message.body
			const isVerification = payload.type === 'email-verification'
			const { error } = await resend.emails.send({
				from: env.RESEND_FROM_EMAIL,
				to: payload.to,
				subject: isVerification
					? 'Verify your Low Level Lab email'
					: 'Reset your Low Level Lab password',
				html: isVerification
					? `<p>Verify your email address by clicking the link below:</p><p><a href="${payload.url}">Verify email</a></p>`
					: `<p>Reset your password by clicking the link below:</p><p><a href="${payload.url}">Reset password</a></p>`,
			})

			if (error) {
				const emailType = isVerification ? 'verification' : 'password reset'
				throw new Error(
					`Resend ${emailType} email failed: ${error.message}`,
				)
			}
		}
	},
} satisfies ExportedHandler<Env>;
