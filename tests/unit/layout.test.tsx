import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BarChart3 } from 'lucide-react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// AppLayout, Sidebar, Topbar and the small shared widgets.

type Session = { user: { name: string; email: string } } | null
const state: { data: Session; isPending: boolean } = { data: null, isPending: false }
vi.mock('@hooks/useAuth', () => ({ useAuth: () => state }))

const { AppLayout } = await import('@components/layout/AppLayout')
const { Sidebar } = await import('@components/layout/Sidebar')
const { Topbar } = await import('@components/layout/Topbar')
const { PageIntro } = await import('@components/shared/PageIntro')
const { StatCard } = await import('@components/shared/StatCard')
const { ActivityHeatmap } = await import('@components/shared/ActivityHeatmap')
const { MemorySpaceWidget } = await import('@components/shared/MemorySpaceWidget')
const { HardwareLatencyWidget } = await import('@components/shared/HardwareLatencyWidget')
const { AuthAside } = await import('@components/auth/AuthAside')

beforeEach(() => {
	state.data = null
	state.isPending = false
})

function renderShell(path = '/') {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Routes>
				<Route element={<AppLayout />}>
					<Route path="*" element={<p>Page body</p>} />
				</Route>
			</Routes>
		</MemoryRouter>,
	)
}

describe('AppLayout', () => {
	it('renders the routed page inside main', () => {
		renderShell()
		expect(within(screen.getByRole('main')).getByText('Page body')).toBeInTheDocument()
	})

	it.each([
		['/', 'Dashboard'],
		['/questions', 'Questions'],
		['/topics', 'Topics'],
		['/progress', 'Progress'],
		['/analytics', 'Analytics'],
		['/profile', 'Profile'],
		['/manage', 'Manage'],
		['/questions/q1', 'Questions'],
		['/topics/caches', 'Questions'],
	])('titles %s as %s', (path, title) => {
		renderShell(path)
		expect(screen.getByText(`/ ${title}`)).toBeInTheDocument()
	})

	it('opens the sidebar and shows an overlay', async () => {
		const { container } = renderShell()
		expect(container.querySelector('.sidebar')).not.toHaveClass('sidebar-open')
		expect(screen.queryByRole('button', { name: 'Close navigation' })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
		expect(container.querySelector('.sidebar')).toHaveClass('sidebar-open')
		expect(screen.getByRole('button', { name: 'Close navigation' })).toBeInTheDocument()
	})

	it.each(['Close navigation', 'Close menu'])('closes the sidebar with %s', async (name) => {
		const { container } = renderShell()
		await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
		await userEvent.click(screen.getByRole('button', { name }))
		expect(container.querySelector('.sidebar')).not.toHaveClass('sidebar-open')
	})

	it('closes the sidebar after following a nav link', async () => {
		const { container } = renderShell()
		await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
		await userEvent.click(screen.getByRole('link', { name: /Topics/ }))
		expect(container.querySelector('.sidebar')).not.toHaveClass('sidebar-open')
		expect(screen.getByText('/ Topics')).toBeInTheDocument()
	})

	it('toggles the theme on the document', async () => {
		renderShell()
		expect(document.documentElement.dataset.theme).toBe('light')
		await userEvent.click(screen.getByRole('button', { name: 'Switch to the dark chassis' }))
		expect(document.documentElement.dataset.theme).toBe('dark')
		await userEvent.click(screen.getByRole('button', { name: 'Switch to the light faceplate' }))
		expect(document.documentElement.dataset.theme).toBe('light')
	})
})

describe('Sidebar', () => {
	function renderSidebar(path = '/', onClose = vi.fn()) {
		render(<MemoryRouter initialEntries={[path]}><Sidebar open={false} onClose={onClose} /></MemoryRouter>)
		return onClose
	}

	it('labels the navigation landmark', () => {
		renderSidebar()
		expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
	})

	it.each([
		['Dashboard', '/'],
		['Questions', '/questions'],
		['Topics', '/topics'],
		['Progress', '/progress'],
		['Analytics', '/analytics'],
		['Submit a question', '/manage?view=submit'],
		['Review queue', '/manage?view=review'],
		['Admin moderation', '/manage?view=admin'],
		['Manage topics', '/manage?view=topics'],
		['Super admin', '/manage?view=super-admin'],
		['Profile', '/profile'],
	])('links %s to %s', (name, href) => {
		renderSidebar()
		expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
	})

	it('marks only the current section active', () => {
		renderSidebar('/topics')
		expect(screen.getByRole('link', { name: 'Topics' })).toHaveClass('active')
		expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('active')
	})

	it('only marks Dashboard active on the exact root', () => {
		renderSidebar('/questions')
		expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveClass('active')
		expect(screen.getByRole('link', { name: 'Questions' })).toHaveClass('active')
	})

	it('keeps a section active on its detail pages', () => {
		renderSidebar('/topics/caches')
		expect(screen.getByRole('link', { name: 'Topics' })).toHaveClass('active')
	})

	it('shows coding questions as not yet available, not as a link', () => {
		renderSidebar()
		expect(screen.getByText('Soon')).toBeInTheDocument()
		expect(screen.queryByRole('link', { name: /Coding Questions/ })).not.toBeInTheDocument()
	})

	it('shows a guest identity when signed out', () => {
		renderSidebar()
		expect(screen.getByText('My Learning')).toBeInTheDocument()
		expect(screen.getByText('Guest workspace')).toBeInTheDocument()
		expect(screen.getByText('ML')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Sign in to sync progress/ })).toHaveAttribute('href', '/auth')
	})

	it('shows a loading label while pending', () => {
		state.isPending = true
		renderSidebar()
		expect(screen.getByText('Loading profile…')).toBeInTheDocument()
	})

	it('shows the user, their email and initials', () => {
		state.data = { user: { name: 'Grace Brewster Hopper', email: 'grace@example.com' } }
		renderSidebar()
		expect(screen.getByText('Grace Brewster Hopper')).toBeInTheDocument()
		expect(screen.getByText('grace@example.com')).toBeInTheDocument()
		expect(screen.getByText('GB')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Account settings/ })).toBeInTheDocument()
	})

	it.each([
		['ada', 'A'],
		['ada lovelace', 'AL'],
		['  ada   lovelace  ', 'AL'],
		['', 'ML'],
	])('derives initials from %j as %s', (name, initials) => {
		state.data = { user: { name, email: 'x@y.z' } }
		renderSidebar()
		expect(document.querySelector('.avatar')).toHaveTextContent(initials)
	})

	it('calls onClose from the close button', async () => {
		const onClose = renderSidebar()
		await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))
		expect(onClose).toHaveBeenCalledTimes(1)
	})
})

describe('Topbar', () => {
	function renderTopbar(props: Partial<Parameters<typeof Topbar>[0]> = {}) {
		const handlers = { onMenuOpen: vi.fn(), onThemeToggle: vi.fn() }
		render(<MemoryRouter><Topbar theme="light" pageTitle="Topics" {...handlers} {...props} /></MemoryRouter>)
		return handlers
	}

	it('shows the breadcrumb and page title', () => {
		renderTopbar()
		expect(screen.getByText('Low Level Lab')).toBeInTheDocument()
		expect(screen.getByText('/ Topics')).toBeInTheDocument()
	})

	it.each([
		['light', 'Switch to the dark chassis'],
		['dark', 'Switch to the light faceplate'],
	] as const)('names the theme button for %s', (theme, name) => {
		renderTopbar({ theme })
		expect(screen.getByRole('button', { name })).toBeInTheDocument()
	})

	it('fires the handlers', async () => {
		const handlers = renderTopbar()
		await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))
		await userEvent.click(screen.getByRole('button', { name: 'Switch to the dark chassis' }))
		expect(handlers.onMenuOpen).toHaveBeenCalledTimes(1)
		expect(handlers.onThemeToggle).toHaveBeenCalledTimes(1)
	})

	it('links the avatar to the profile with an accessible name', () => {
		renderTopbar()
		const link = screen.getByRole('link', { name: 'Your profile' })
		expect(link).toHaveAttribute('href', '/profile')
		expect(link).toHaveTextContent('LL')
	})

	it('shows the user initials', () => {
		state.data = { user: { name: 'linus torvalds', email: 'l@k.org' } }
		renderTopbar()
		expect(screen.getByRole('link', { name: 'Your profile' })).toHaveTextContent('LT')
	})

	it('gives every button an accessible name', () => {
		renderTopbar()
		for (const button of screen.getAllByRole('button')) expect(button).toHaveAccessibleName()
	})
})

describe('shared widgets', () => {
	it('PageIntro renders eyebrow, heading and description', () => {
		render(<PageIntro eyebrow="Eyebrow" title="Title" description="Description" />)
		expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument()
		expect(screen.getByText('Eyebrow')).toBeInTheDocument()
		expect(screen.getByText('Description')).toBeInTheDocument()
	})

	it('StatCard renders label, value and detail', () => {
		render(<StatCard label="Reads" value="3,412" detail="Last 30 days" icon={BarChart3} />)
		expect(screen.getByText('Reads')).toBeInTheDocument()
		expect(screen.getByText('3,412')).toBeInTheDocument()
		expect(screen.getByText('Last 30 days')).toBeInTheDocument()
	})

	it('ActivityHeatmap draws sixty labelled days at levels 0 to 5', () => {
		render(<ActivityHeatmap />)
		const map = screen.getByLabelText('60 day activity heatmap')
		const cells = map.querySelectorAll('span')
		expect(cells).toHaveLength(60)
		for (const cell of cells) expect(cell.className).toMatch(/^heat-[0-5]$/)
	})

	it('MemorySpaceWidget lists the six regions top-down with one marked active', () => {
		const { container } = render(<MemorySpaceWidget />)
		const rows = container.querySelectorAll('.memory-row')
		expect(rows).toHaveLength(6)
		expect([...rows].map((row) => row.querySelector('strong')!.textContent)).toEqual(['stack', 'frame: parse()', 'mmap', 'heap', '.bss / .data', '.text'])
		expect(container.querySelectorAll('.memory-row.active')).toHaveLength(1)
	})

	it('HardwareLatencyWidget orders the hierarchy fastest first and highlights DRAM', () => {
		const { container } = render(<HardwareLatencyWidget />)
		const rows = [...container.querySelectorAll('.latency-row')]
		expect(rows.map((row) => row.querySelector('strong')!.textContent)).toEqual(['L1 cache', 'L2 cache', 'L3 cache', 'DRAM'])
		const cycles = rows.map((row) => Number.parseInt(row.querySelector('.mono')!.textContent!))
		expect(cycles).toEqual([...cycles].sort((a, b) => a - b))
		expect(rows.at(-1)).toHaveClass('active')
	})

	it('AuthAside shows the latency ladder in increasing cost', () => {
		const { container } = render(<AuthAside />)
		const widths = [...container.querySelectorAll('.auth-ladder i')].map((bar) => Number.parseFloat((bar as HTMLElement).style.width))
		expect(widths).toEqual([6, 13, 32, 100])
		expect(screen.getByText('DRAM')).toBeInTheDocument()
	})
})
