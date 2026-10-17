import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// The route table in src/App.tsx, and the useAuth hook that wraps the better-auth client.

const authClient = vi.hoisted(() => ({
	useSession: vi.fn(() => ({ data: null as unknown, isPending: false })),
	signIn: { email: vi.fn(), social: vi.fn() },
	signUp: { email: vi.fn() },
	signOut: vi.fn(),
	requestPasswordReset: vi.fn(),
	resetPassword: vi.fn(),
}))
vi.mock('@services/auth-client', () => ({ authClient }))

// Pages are stubbed so this file tests routing only.
vi.mock('@pages/DashboardPage', () => ({ DashboardPage: () => <h1>Dashboard page</h1> }))
vi.mock('@pages/QuestionsPage', () => ({ QuestionsPage: () => <h1>Questions page</h1> }))
vi.mock('@pages/QuestionDetailPage', () => ({ QuestionDetailPage: () => <h1>Question detail page</h1> }))
vi.mock('@pages/TopicsPage', () => ({ TopicsPage: () => <h1>Topics page</h1> }))
vi.mock('@pages/TopicDetailPage', () => ({ TopicDetailPage: () => <h1>Topic detail page</h1> }))
vi.mock('@pages/ProgressPage', () => ({ ProgressPage: () => <h1>Progress page</h1> }))
vi.mock('@pages/ContentManagementPage', () => ({ ContentManagementPage: () => <h1>Manage page</h1> }))
vi.mock('@pages/AnalyticsPage', () => ({ AnalyticsPage: () => <h1>Analytics page</h1> }))
vi.mock('@pages/ProfilePage', () => ({ ProfilePage: () => <h1>Profile page</h1> }))
vi.mock('@pages/AuthPage', () => ({ AuthPage: () => <h1>Auth page</h1> }))

const { default: App } = await import('../../src/App')
const { useAuth } = await import('@hooks/useAuth')

function visit(path: string) {
	window.history.pushState({}, '', path)
	return render(<App />)
}

describe('routes for a signed-in user', () => {
	it.each([
		['/', 'Dashboard page'],
		['/questions', 'Questions page'],
		['/questions/q1', 'Question detail page'],
		['/topics', 'Topics page'],
		['/topics/caches', 'Topic detail page'],
		['/progress', 'Progress page'],
		['/manage', 'Manage page'],
		['/analytics', 'Analytics page'],
		['/profile', 'Profile page'],
		['/auth', 'Auth page'],
		['/reset-password', 'Auth page'],
	])('%s renders %s', (path, heading) => {
		authClient.useSession.mockReturnValue({ data: { user: { name: 'Ada', email: 'a@b.c' } }, isPending: false })
		visit(path)
		expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
	})

	it('wraps app routes in the shell', () => {
		authClient.useSession.mockReturnValue({ data: { user: { name: 'Ada', email: 'a@b.c' } }, isPending: false })
		visit('/topics')
		expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
	})

	it('does not wrap the auth page in the shell', () => {
		visit('/auth')
		expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument()
	})

	it('redirects an unknown path to the dashboard', () => {
		authClient.useSession.mockReturnValue({ data: { user: { name: 'Ada', email: 'a@b.c' } }, isPending: false })
		visit('/does/not/exist')
		expect(screen.getByRole('heading', { name: 'Dashboard page' })).toBeInTheDocument()
		expect(window.location.pathname).toBe('/')
	})
})

describe('routes for a visitor', () => {
	it.each(['/', '/questions', '/topics/caches', '/progress', '/manage', '/profile'])('%s redirects to sign-in', (path) => {
		authClient.useSession.mockReturnValue({ data: null, isPending: false })
		visit(path)
		expect(screen.getByRole('heading', { name: 'Auth page' })).toBeInTheDocument()
		expect(window.location.pathname).toBe('/auth')
	})

	it.each(['/auth', '/reset-password'])('%s stays public', (path) => {
		authClient.useSession.mockReturnValue({ data: null, isPending: false })
		visit(path)
		expect(window.location.pathname).toBe(path)
	})
})

describe('useAuth', () => {
	function Probe() {
		const auth = useAuth()
		return <output>{JSON.stringify({ pending: auth.isPending, user: (auth.data as { user?: { name: string } } | null)?.user?.name ?? null })}</output>
	}

	it('exposes the session state', () => {
		authClient.useSession.mockReturnValue({ data: { user: { name: 'Ada' } }, isPending: true })
		render(<Probe />)
		expect(screen.getByRole('status')).toHaveTextContent('{"pending":true,"user":"Ada"}')
	})

	it('maps each action to the better-auth client', () => {
		let captured: ReturnType<typeof useAuth> | undefined
		function Capture() {
			captured = useAuth()
			return null
		}
		render(<Capture />)
		expect(captured!.signIn).toBe(authClient.signIn.email)
		expect(captured!.signInSocial).toBe(authClient.signIn.social)
		expect(captured!.signUp).toBe(authClient.signUp.email)
		expect(captured!.signOut).toBe(authClient.signOut)
		expect(captured!.requestPasswordReset).toBe(authClient.requestPasswordReset)
		expect(captured!.resetPassword).toBe(authClient.resetPassword)
	})
})
