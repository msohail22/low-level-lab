import { AuthForm } from '@components/auth/AuthForm'
import { AuthenticatedView } from '@components/auth/AuthenticatedView'
import { ResetPasswordForm } from '@components/auth/ResetPasswordForm'
import { useAuth } from '@hooks/useAuth'
import { useSearchParams } from 'react-router-dom'
import { MemorySpaceWidget } from '@components/shared/MemorySpaceWidget'

export function AuthPage() {
	const { data: session, isPending } = useAuth()
	const [searchParams] = useSearchParams()
	const resetToken = searchParams.get('token')

	if (isPending) {
		return <main className="auth-shell">Loading session...</main>
	}

	return (
		<main className="auth-shell">
			<div className="auth-intro"><span className="eyebrow">Low Level Lab / secure workspace</span><h1>Keep the machine model close.</h1><p>Sign in to carry your progress, drafts, and review work between sessions.</p><MemorySpaceWidget /></div>
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
