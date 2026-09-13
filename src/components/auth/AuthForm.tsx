import { useState, type FormEvent } from 'react'

import { useAuth } from '@hooks/useAuth'

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

		async function handlePasswordResetRequest(
			event: FormEvent<HTMLFormElement>,
		) {
			event.preventDefault()
			setError('')
			const result = await requestPasswordReset('/request-password-reset', {
				method: 'POST',
				body: {
					email,
					redirectTo: `${window.location.origin}/reset-password`,
				},
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
						<label>
							Email
							<input
								required
								type="email"
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
							Continue with Google
						</button>
						<button type="button" onClick={() => signInSocial({ provider: 'github' })}>
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
