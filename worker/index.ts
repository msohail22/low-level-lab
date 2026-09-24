import { createAuth } from './auth.js'
import { handleQuestionRequest } from './controllers/question-controller.js'
import { handleProgressRequest } from './controllers/progress-controller.js'
import { codingExecutionPlaceholder } from './controllers/placeholder-controller.js'
import { handleSocialPublish } from './controllers/social-controller.js'
import { handleTopicRequest } from './controllers/topic-controller.js'
import { handleAuthorizationRequest } from './controllers/authorization-controller.js'
import { handleModerationRequest } from './controllers/moderation-controller.js'
import { Resend } from 'resend'

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
	async fetch(request, env) {
		try {
			const url = new URL(request.url)

			if (url.pathname.startsWith('/api/auth/')) {
				const auth = createAuth(env, request)
				return await auth.handler(request)
			}

			if (url.pathname.startsWith('/api/topics')) {
				const topicId = url.pathname.split('/')[3]
				return await handleTopicRequest(request, env, topicId)
			}

			if (url.pathname.startsWith('/api/progress')) {
				return await handleProgressRequest(request, env)
			}

			if (url.pathname === '/api/admin/roles') {
				return await handleAuthorizationRequest(request, env)
			}

			if (url.pathname.startsWith('/api/moderation')) {
				return await handleModerationRequest(request, env)
			}

			if (url.pathname.startsWith('/api/social/publish/')) return await handleSocialPublish(request, env, url.pathname.split('/').filter(Boolean)[3])
			if (url.pathname.endsWith('/execute')) return codingExecutionPlaceholder()

			if (url.pathname.startsWith('/api/questions')) {
				const segments = url.pathname.split('/').filter(Boolean)
				const questionId = segments[2]
				const action = segments[3]
				return await handleQuestionRequest(request, env, questionId, action)
			}

			if (url.pathname.startsWith('/api/')) {
				return Response.json({
					name: 'Cloudflare',
				})
			}

			return new Response(null, { status: 404 })
		} catch (error) {
			console.error('Unhandled Worker Exception:', error)
			return Response.json(
				{
					error: 'Internal Server Error',
					message: error instanceof Error ? error.message : String(error),
				},
				{ status: 500 },
			)
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
