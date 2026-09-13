import { createAuth } from './auth.js'
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
		const url = new URL(request.url)

		if (url.pathname.startsWith('/api/auth/')) {
			const auth = createAuth(env, request)
			return auth.handler(request)
		}

		if (url.pathname.startsWith('/api/')) {
			return Response.json({
				name: 'Cloudflare',
			})
		}

		return new Response(null, { status: 404 });
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
