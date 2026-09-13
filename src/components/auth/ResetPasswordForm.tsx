import { useState, type FormEvent } from 'react'

import { authClient } from '../../services/auth-client'

export function ResetPasswordForm({ token }: { token: string }) {
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [complete, setComplete] = useState(false)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError('')
		const result = await authClient.$fetch('/reset-password', {
			method: 'POST',
			body: { token, newPassword: password },
		})
		if (result.error) {
			setError(result.error.message ?? 'Unable to reset password')
			return
		}
		setComplete(true)
	}

	return (
		<section className="auth-card">
			<p className="eyebrow">Low Level Lab</p>
			<h1>Choose a new password</h1>
			{complete ? (
				<p>Your password has been updated. You can now sign in.</p>
			) : (
				<form onSubmit={handleSubmit}>
					<label>
						New password
						<input
							required
							minLength={8}
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
					</label>
					{error && <p className="error">{error}</p>}
					<button type="submit">Update password</button>
				</form>
			)}
		</section>
	)
}
