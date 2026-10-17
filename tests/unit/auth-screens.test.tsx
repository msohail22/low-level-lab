import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// RequireAuth, AuthPage, ResetPasswordForm and AuthenticatedView — everything that decides what a
// visitor sees based on their session.

type Session = { user: { name: string; email: string } } | null
const state: { data: Session; isPending: boolean } = { data: null, isPending: false }
const resetPassword = vi.fn()
const signOut = vi.fn()

vi.mock('@hooks/useAuth', () => ({
	useAuth: () => ({
		...state,
		resetPassword,
		signOut,
		signIn: vi.fn(),
		signUp: vi.fn(),
		signInSocial: vi.fn(),
		requestPasswordReset: vi.fn(),
	}),
}))

const { RequireAuth } = await import('@components/auth/RequireAuth')
const { AuthPage } = await import('@pages/AuthPage')
const { ResetPasswordForm } = await import('@components/auth/ResetPasswordForm')
const { AuthenticatedView } = await import('@components/auth/AuthenticatedView')

const ada = { user: { name: 'Ada Lovelace', email: 'ada@example.com' } }

function LocationProbe() {
	const location = useLocation()
	return <output data-testid="location">{JSON.stringify({ path: location.pathname + location.search, state: location.state })}</output>
}

function location() {
	return JSON.parse(screen.getByTestId('location').textContent!)
}

beforeEach(() => {
	vi.clearAllMocks()
	state.data = null
	state.isPending = false
})

describe('RequireAuth', () => {
	function renderAt(entry: string) {
		return render(
			<MemoryRouter initialEntries={[entry]}>
				<Routes>
					<Route path="/auth" element={<LocationProbe />} />
					<Route path="*" element={<RequireAuth><p>Secret page</p></RequireAuth>} />
				</Routes>
			</MemoryRouter>,
		)
	}

	it('shows a loading state while the session resolves', () => {
		state.isPending = true
		renderAt('/progress')
		expect(screen.getByText('Loading session...')).toBeInTheDocument()
		expect(screen.queryByText('Secret page')).not.toBeInTheDocument()
	})

	it('renders the page for a signed-in user', () => {
		state.data = ada
		renderAt('/progress')
		expect(screen.getByText('Secret page')).toBeInTheDocument()
	})

	it('redirects a visitor to /auth', () => {
		renderAt('/progress')
		expect(screen.queryByText('Secret page')).not.toBeInTheDocument()
		expect(location().path).toBe('/auth')
	})

	it.each([
		['/progress', '/progress'],
		['/questions?topicId=caches', '/questions?topicId=caches'],
		['/topics/caches#top', '/topics/caches#top'],
		['/', '/'],
	])('remembers %s so sign-in can return there', (entry, from) => {
		renderAt(entry)
		expect(location().state).toEqual({ from })
	})

	it('treats a session without a user as signed out', () => {
		state.data = {} as Session
		renderAt('/progress')
		expect(location().path).toBe('/auth')
	})
})

describe('AuthPage', () => {
	function renderAuth(entry: string | { pathname: string; search?: string; state?: unknown }) {
		return render(
			<MemoryRouter initialEntries={[entry]}>
				<Routes>
					<Route path="/auth" element={<AuthPage />} />
					<Route path="/reset-password" element={<AuthPage />} />
					<Route path="*" element={<LocationProbe />} />
				</Routes>
			</MemoryRouter>,
		)
	}

	it('always shows the brand aside', () => {
		renderAuth('/auth')
		expect(screen.getByRole('heading', { name: /one level down/i })).toBeInTheDocument()
	})

	it('shows a checking state while pending', () => {
		state.isPending = true
		renderAuth('/auth')
		expect(screen.getByText('Checking your session…')).toBeInTheDocument()
		expect(screen.queryByRole('tab')).not.toBeInTheDocument()
	})

	it('shows the sign-in form to a visitor', () => {
		renderAuth('/auth')
		expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
	})

	it('shows the signed-in view to a user with nowhere to return to', () => {
		state.data = ada
		renderAuth('/auth')
		expect(screen.getByRole('heading', { name: 'Welcome, Ada Lovelace' })).toBeInTheDocument()
	})

	it('sends a signed-in user back where they came from', () => {
		state.data = ada
		renderAuth({ pathname: '/auth', state: { from: '/progress' } })
		expect(location().path).toBe('/progress')
	})

	it('ignores a non-string redirect target', () => {
		state.data = ada
		renderAuth({ pathname: '/auth', state: { from: { evil: true } } })
		expect(screen.getByRole('heading', { name: 'Welcome, Ada Lovelace' })).toBeInTheDocument()
	})

	it('shows the reset form when a token is present', () => {
		renderAuth('/reset-password?token=abc')
		expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument()
	})

	it('prefers the reset form over redirecting, even when signed in', () => {
		state.data = ada
		renderAuth({ pathname: '/reset-password', search: '?token=abc', state: { from: '/progress' } })
		expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument()
	})

	it('treats an empty token as no token', () => {
		renderAuth('/reset-password?token=')
		expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
	})
})

describe('ResetPasswordForm', () => {
	it('labels the password field and asks the browser for a new password', () => {
		render(<ResetPasswordForm token="t" />)
		const field = screen.getByLabelText('New password')
		expect(field).toHaveAttribute('type', 'password')
		expect(field).toHaveAttribute('autocomplete', 'new-password')
		expect(field).toHaveAttribute('name', 'new-password')
		expect(field).toHaveAttribute('id', 'new-password')
		expect(field).toBeRequired()
		expect(field).toHaveAttribute('minlength', '8')
	})

	it('sends the new password with the token', async () => {
		resetPassword.mockResolvedValue({ error: null })
		render(<ResetPasswordForm token="tok-123" />)
		await userEvent.type(screen.getByLabelText('New password'), 'correct horse')
		await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
		expect(resetPassword).toHaveBeenCalledWith({ newPassword: 'correct horse', token: 'tok-123' })
	})

	it('confirms success and hides the form', async () => {
		resetPassword.mockResolvedValue({ error: null })
		render(<ResetPasswordForm token="t" />)
		await userEvent.type(screen.getByLabelText('New password'), 'correct horse')
		await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
		expect(await screen.findByText(/password has been updated/i)).toBeInTheDocument()
		expect(screen.queryByLabelText('New password')).not.toBeInTheDocument()
	})

	it('shows the server error and keeps the form', async () => {
		resetPassword.mockResolvedValue({ error: { message: 'Token expired' } })
		render(<ResetPasswordForm token="t" />)
		await userEvent.type(screen.getByLabelText('New password'), 'correct horse')
		await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
		expect(await screen.findByText('Token expired')).toBeInTheDocument()
		expect(screen.getByLabelText('New password')).toBeInTheDocument()
	})

	it('falls back to a generic error', async () => {
		resetPassword.mockResolvedValue({ error: {} })
		render(<ResetPasswordForm token="t" />)
		await userEvent.type(screen.getByLabelText('New password'), 'correct horse')
		await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
		expect(await screen.findByText('Unable to reset password')).toBeInTheDocument()
	})

	it('clears an old error on the next attempt', async () => {
		resetPassword.mockResolvedValueOnce({ error: { message: 'Token expired' } }).mockResolvedValueOnce({ error: null })
		render(<ResetPasswordForm token="t" />)
		await userEvent.type(screen.getByLabelText('New password'), 'correct horse')
		await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
		await screen.findByText('Token expired')
		await userEvent.click(screen.getByRole('button', { name: 'Update password' }))
		expect(await screen.findByText(/password has been updated/i)).toBeInTheDocument()
		expect(screen.queryByText('Token expired')).not.toBeInTheDocument()
	})

	// The eight-character floor is enforced by the browser through `minlength`, which jsdom does
	// not implement, so the attribute test above is the check.
})

describe('AuthenticatedView', () => {
	it('renders nothing without a user', () => {
		const { container } = render(<AuthenticatedView />)
		expect(container).toBeEmptyDOMElement()
	})

	it('greets the user by name and shows their email', () => {
		state.data = ada
		render(<AuthenticatedView />)
		expect(screen.getByRole('heading', { name: 'Welcome, Ada Lovelace' })).toBeInTheDocument()
		expect(screen.getByText(/ada@example\.com/)).toBeInTheDocument()
	})

	it('signs out', async () => {
		state.data = ada
		render(<AuthenticatedView />)
		await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
		expect(signOut).toHaveBeenCalledTimes(1)
	})
})
