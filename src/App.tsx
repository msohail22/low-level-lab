import { useState, type FormEvent } from 'react'

import { authClient } from './lib/auth-client'

function App() {
	const { data: session, isPending } = authClient.useSession()
	const [isSignUp, setIsSignUp] = useState(false)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [error, setError] = useState('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')

		const result = isSignUp
			? await authClient.signUp.email({ email, password, name })
			: await authClient.signIn.email({ email, password })

		if (result.error) {
			setError(result.error.message ?? 'Authentication failed')
		}
	}

	async function handleSignOut() {
		await authClient.signOut()
	}

	if (isPending) {
		return <main className="auth-shell">Loading session...</main>
	}

	if (session?.user) {
		return (
			<main className="auth-shell">
				<section className="auth-card">
					<p className="eyebrow">Low Level Lab</p>
					<h1>Welcome, {session.user.name}</h1>
					<p>You are signed in as {session.user.email}.</p>
					<button type="button" onClick={handleSignOut}>
						Sign out
					</button>
				</section>
			</main>
		)
	}

	return (
		<main className="auth-shell">
			<section className="auth-card">
				<p className="eyebrow">Low Level Lab</p>
				<h1>{isSignUp ? 'Create your account' : 'Sign in'}</h1>
				<p>
					{isSignUp
						? 'Create an account to continue.'
						: 'Use your account to continue.'}
				</p>
				<form onSubmit={handleSubmit}>
					{isSignUp && (
						<label>
							Name
							<input
								required
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</label>
					)}
					<label>
						Email
						<input
							required
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</label>
					<label>
						Password
						<input
							required
							minLength={8}
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
					</label>
					{error && <p className="error">{error}</p>}
					<button type="submit">{isSignUp ? 'Sign up' : 'Sign in'}</button>
				</form>
				<button
					className="link-button"
					type="button"
					onClick={() => setIsSignUp((current) => !current)}
				>
					{isSignUp
						? 'Already have an account? Sign in'
						: 'Need an account? Sign up'}
				</button>
			</section>
		</main>
	)
}

export default App
