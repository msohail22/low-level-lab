import { authClient } from '../services/auth-client'

export function useAuth() {
	const session = authClient.useSession()

	return {
		...session,
		signIn: authClient.signIn.email,
		signUp: authClient.signUp.email,
		signOut: authClient.signOut,
	}
}
