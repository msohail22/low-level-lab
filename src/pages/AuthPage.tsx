import { AuthForm } from '../components/auth/AuthForm'
import { AuthenticatedView } from '../components/auth/AuthenticatedView'
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm'
import { useAuth } from '../hooks/useAuth'

export function AuthPage() {
	const { data: session, isPending } = useAuth()
	const resetToken = new URLSearchParams(window.location.search).get('token')

	if (isPending) {
		return <main className="auth-shell">Loading session...</main>
	}

	return (
		<main className="auth-shell">
			{resetToken ? (
				<ResetPasswordForm token={resetToken} />
			) : session?.user ? (
				<AuthenticatedView />
			) : (
				<AuthForm />
			)}
		</main>
	)
}
