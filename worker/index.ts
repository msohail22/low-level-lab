import { createAuth } from './auth.js'

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
} satisfies ExportedHandler<Env>;
