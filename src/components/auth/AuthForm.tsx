import { useState, type FormEvent } from 'react'

import { useAuth } from '@hooks/useAuth'

function GoogleLogo() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
			<path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.54Z" />
			<path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.59A10 10 0 0 0 12 22Z" />
			<path fill="#FBBC05" d="M6.39 13.89A6 6 0 0 1 6.07 12c0-.66.11-1.3.32-1.89V7.52H3.05A10 10 0 0 0 2 12c0 1.61.38 3.13 1.05 4.48l3.34-2.59Z" />
			<path fill="#EA4335" d="M12 5.98c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.96 2.99 14.7 2 12 2a10 10 0 0 0-8.95 5.52l3.34 2.59C7.18 7.74 9.39 5.98 12 5.98Z" />
		</svg>
	)
}

function GithubLogo() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
			<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.9 1.54 2.34 1.1 2.91.84.09-.65.35-1.1.63-1.35-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 7.99c.85 0 1.71.12 2.51.36 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.59c0 .26.18.57.69.47A10 10 0 0 0 12 2Z" />
		</svg>
	)
}

export function AuthForm() {
	const { signIn, signInSocial, signUp, requestPasswordReset } = useAuth()
	const [isSignUp, setIsSignUp] = useState(false)
	const [isForgotPassword, setIsForgotPassword] = useState(false)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [error, setError] = useState('')

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')

		const result = isSignUp
			? await signUp({ email, password, name })
			: await signIn({ email, password })

		if (result.error) {
			setError(result.error.message ?? 'Authentication failed')
		}
	}

	async function handlePasswordResetRequest(
		event: FormEvent<HTMLFormElement>,
	) {
		event.preventDefault()
		setError('')
		const result = await requestPasswordReset({
			email,
			redirectTo: `${window.location.origin}/reset-password`,
		})
		if (result.error) {
			setError(result.error.message ?? 'Unable to send reset email')
		}
	}

	if (isForgotPassword) {
		return (
			<section className="auth-card">
				<p className="eyebrow">Low Level Lab</p>
				<h1>Reset your password</h1>
				<p>Enter your email and we will send a reset link.</p>
				<form onSubmit={handlePasswordResetRequest}>
					<label htmlFor="reset-email">
						Email
						<input
							required
							id="reset-email"
							name="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					</label>
					{error && <p className="error">{error}</p>}
					<button type="submit">Send reset link</button>
				</form>
				<button
					className="link-button"
					type="button"
					onClick={() => setIsForgotPassword(false)}
				>
					Back to sign in
				</button>
			</section>
		)
	}

	return (
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
				<label htmlFor="auth-email">
					Email
					<input
						required
						id="auth-email"
						name="email"
						type="email"
						autoComplete="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
				</label>
				<label htmlFor="auth-password">
					Password
					<input
						required
						minLength={8}
						id="auth-password"
						name="password"
						type="password"
						autoComplete={isSignUp ? 'new-password' : 'current-password'}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</label>
				{error && <p className="error">{error}</p>}
				<button type="submit">{isSignUp ? 'Sign up' : 'Sign in'}</button>
			</form>
			{!isSignUp && (
				<>
					<button
						className="link-button"
						type="button"
						onClick={() => setIsForgotPassword(true)}
					>
						Forgot password?
					</button>
					<div className="social-actions">
						<button type="button" onClick={() => signInSocial({ provider: 'google' })}>
							<GoogleLogo />
							Continue with Google
						</button>
						<button type="button" onClick={() => signInSocial({ provider: 'github' })}>
							<GithubLogo />
							Continue with GitHub
						</button>
					</div>
				</>
			)}
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
	)
}
