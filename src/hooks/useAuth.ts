import { authClient } from '../services/auth-client'

export function useAuth() {
	const session = authClient.useSession()

	return {
		...session,
		signIn: authClient.signIn.email,
		signInSocial: authClient.signIn.social,
		signUp: authClient.signUp.email,
		signOut: authClient.signOut,
		requestPasswordReset: authClient.$fetch,
	}
}
