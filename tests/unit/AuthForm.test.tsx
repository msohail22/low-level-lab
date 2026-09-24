import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signIn = vi.fn().mockResolvedValue({ error: null })
const signUp = vi.fn().mockResolvedValue({ error: null })
const signInSocial = vi.fn().mockResolvedValue({ error: null })
const requestPasswordReset = vi.fn().mockResolvedValue({ error: null })

vi.mock('@hooks/useAuth', () => ({
	useAuth: () => ({ signIn, signUp, signInSocial, requestPasswordReset }),
}))

const { AuthForm } = await import('@components/auth/AuthForm')

beforeEach(() => vi.clearAllMocks())

describe('sign in / sign up switch', () => {
	it('starts on sign in', () => {
		render(<AuthForm />)
		expect(screen.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true')
		expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
	})

	it('exposes both choices as tabs so the state is announced', () => {
		render(<AuthForm />)
		expect(screen.getAllByRole('tab')).toHaveLength(2)
	})

	it('switches to create account', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
		expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
		expect(screen.getByRole('tab', { name: 'Create account' })).toHaveAttribute('aria-selected', 'true')
	})

	it('asks for a name only when creating an account', async () => {
		render(<AuthForm />)
		expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
		expect(screen.getByLabelText('Name')).toBeInTheDocument()
	})

	it('offers forgot-password only on sign in', async () => {
		render(<AuthForm />)
		expect(screen.getByRole('button', { name: /forgot your password/i })).toBeInTheDocument()
		await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
		expect(screen.queryByRole('button', { name: /forgot your password/i })).not.toBeInTheDocument()
	})
})

describe('field wiring', () => {
	it('labels the email field', () => {
		render(<AuthForm />)
		expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'auth-email')
	})

	it('gives every field a name so browsers can save it', () => {
		render(<AuthForm />)
		expect(screen.getByLabelText('Email')).toHaveAttribute('name', 'email')
		expect(screen.getByLabelText(/password/i)).toHaveAttribute('name', 'password')
	})

	it('asks for the current password when signing in', () => {
		render(<AuthForm />)
		expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password')
	})

	it('asks for a new password when signing up', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
		expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'new-password')
	})

	it('enforces a minimum password length', () => {
		render(<AuthForm />)
		expect(screen.getByLabelText(/password/i)).toHaveAttribute('minLength', '8')
	})

	it('marks email and password as required', () => {
		render(<AuthForm />)
		expect(screen.getByLabelText('Email')).toBeRequired()
		expect(screen.getByLabelText(/password/i)).toBeRequired()
	})
})

describe('submitting', () => {
	it('signs in with the typed credentials', async () => {
		render(<AuthForm />)
		await userEvent.type(screen.getByLabelText('Email'), 'reader@example.com')
		await userEvent.type(screen.getByLabelText(/password/i), 'correct horse battery')
		await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
		expect(signIn).toHaveBeenCalledWith({ email: 'reader@example.com', password: 'correct horse battery' })
	})

	it('signs up with a name as well', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
		await userEvent.type(screen.getByLabelText('Name'), 'Ada')
		await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
		await userEvent.type(screen.getByLabelText(/password/i), 'a long enough one')
		await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
		expect(signUp).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'a long enough one', name: 'Ada' })
	})

	it('surfaces the failure message', async () => {
		signIn.mockResolvedValueOnce({ error: { message: 'Invalid email or password' } })
		render(<AuthForm />)
		await userEvent.type(screen.getByLabelText('Email'), 'reader@example.com')
		await userEvent.type(screen.getByLabelText(/password/i), 'wrong one here')
		await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
		expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
	})

	it('falls back to a readable message when the error has none', async () => {
		signIn.mockResolvedValueOnce({ error: {} })
		render(<AuthForm />)
		await userEvent.type(screen.getByLabelText('Email'), 'reader@example.com')
		await userEvent.type(screen.getByLabelText(/password/i), 'wrong one here')
		await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
		expect(await screen.findByText('Authentication failed')).toBeInTheDocument()
	})

	it('clears a previous error when switching tabs', async () => {
		signIn.mockResolvedValueOnce({ error: { message: 'Invalid email or password' } })
		render(<AuthForm />)
		await userEvent.type(screen.getByLabelText('Email'), 'reader@example.com')
		await userEvent.type(screen.getByLabelText(/password/i), 'wrong one here')
		await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
		expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
		expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
	})
})

describe('social providers', () => {
	it('offers GitHub first, since that is the audience', () => {
		render(<AuthForm />)
		const social = screen.getAllByRole('button', { name: /continue with/i })
		expect(social[0]).toHaveAccessibleName(/github/i)
		expect(social[1]).toHaveAccessibleName(/google/i)
	})

	it('starts the GitHub flow', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('button', { name: /continue with github/i }))
		expect(signInSocial).toHaveBeenCalledWith({ provider: 'github' })
	})

	it('starts the Google flow', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('button', { name: /continue with google/i }))
		expect(signInSocial).toHaveBeenCalledWith({ provider: 'google' })
	})

	it('offers social sign-in on the create-account tab too', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('tab', { name: 'Create account' }))
		expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
	})
})

describe('password reset', () => {
	it('opens the reset view', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('button', { name: /forgot your password/i }))
		expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
	})

	it('requests a reset link with a redirect back to the app', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('button', { name: /forgot your password/i }))
		await userEvent.type(screen.getByLabelText('Email'), 'reader@example.com')
		await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
		expect(requestPasswordReset).toHaveBeenCalledWith({
			email: 'reader@example.com',
			redirectTo: `${window.location.origin}/reset-password`,
		})
	})

	it('goes back to sign in', async () => {
		render(<AuthForm />)
		await userEvent.click(screen.getByRole('button', { name: /forgot your password/i }))
		await userEvent.click(screen.getByRole('button', { name: 'Back to sign in' }))
		expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
	})
})
