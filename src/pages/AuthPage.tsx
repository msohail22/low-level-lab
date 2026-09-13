import { AuthForm } from '../components/auth/AuthForm'
import { AuthenticatedView } from '../components/auth/AuthenticatedView'
import { useAuth } from '../hooks/useAuth'

export function AuthPage() {
	const { data: session, isPending } = useAuth()

	if (isPending) {
		return <main className="auth-shell">Loading session...</main>
	}

	return (
		<main className="auth-shell">
			{session?.user ? <AuthenticatedView /> : <AuthForm />}
		</main>
	)
}
