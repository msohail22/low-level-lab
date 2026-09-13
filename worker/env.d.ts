export {}

declare global {
	interface Env {
		DATABASE_URL?: string
		BETTER_AUTH_SECRET: string
		BETTER_AUTH_URL?: string
		GOOGLE_CLIENT_ID?: string
		GOOGLE_CLIENT_SECRET?: string
		GITHUB_CLIENT_ID?: string
		GITHUB_CLIENT_SECRET?: string
		RESEND_API_KEY: string
		RESEND_FROM_EMAIL: string
		OPENFGA_API_URL?: string
		OPENFGA_API_TOKEN?: string
		OPENFGA_STORE_ID?: string
		OPENFGA_MODEL_ID?: string
	}
}
