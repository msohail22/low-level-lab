import { createAuth } from './auth.js'
import { Resend } from 'resend'

type PasswordResetMessage = {
	type: 'password-reset'
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
			const payload = message.body as PasswordResetMessage

			if (payload.type !== 'password-reset') {
				message.retry()
				continue
			}

			const { error } = await resend.emails.send({
				from: env.RESEND_FROM_EMAIL,
				to: payload.to,
				subject: 'Reset your Low Level Lab password',
				html: `<p>Reset your password by clicking the link below:</p><p><a href="${payload.url}">Reset password</a></p>`,
			})

			if (error) {
				throw new Error(`Resend password reset email failed: ${error.message}`)
			}
		}
	},
} satisfies ExportedHandler<Env>;
