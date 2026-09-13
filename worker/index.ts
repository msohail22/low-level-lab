import { createAuth } from './auth.js'
import { Resend } from 'resend'

type EmailMessage = {
	type: 'password-reset' | 'email-verification'
	to: string
	url: string
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
			const payload = message.body as EmailMessage

			if (
				payload.type !== 'password-reset' &&
				payload.type !== 'email-verification'
			) {
				message.retry()
				continue
			}

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
				throw new Error(`Resend password reset email failed: ${error.message}`)
			}
		}
	},
} satisfies ExportedHandler<Env>;
