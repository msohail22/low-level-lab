import { useAuth } from '../../hooks/useAuth'

export function AuthenticatedView() {
	const { data: session, signOut } = useAuth()

	if (!session?.user) {
		return null
	}

	return (
		<section className="auth-card">
			<p className="eyebrow">Low Level Lab</p>
			<h1>Welcome, {session.user.name}</h1>
			<p>You are signed in as {session.user.email}.</p>
			<button type="button" onClick={() => signOut()}>
				Sign out
			</button>
		</section>
	)
}
