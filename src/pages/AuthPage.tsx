import { AuthForm } from '@components/auth/AuthForm'
import { AuthenticatedView } from '@components/auth/AuthenticatedView'
import { ResetPasswordForm } from '@components/auth/ResetPasswordForm'
import { useAuth } from '@hooks/useAuth'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'

export function AuthPage() {
	const { data: session, isPending } = useAuth()
	const [searchParams] = useSearchParams()
	const location = useLocation()
	const resetToken = searchParams.get('token')
	const redirectTo =
		typeof location.state?.from === 'string' ? location.state.from : null

	if (isPending) {
		return <main className="auth-shell">Loading session...</main>
	}

	if (session?.user && !resetToken && redirectTo) {
		return <Navigate replace to={redirectTo} />
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
