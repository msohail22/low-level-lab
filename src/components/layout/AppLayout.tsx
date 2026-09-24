import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from '@components/layout/Sidebar'
import { Topbar } from '@components/layout/Topbar'
import { useTheme } from '@hooks/useTheme'

const pageTitles: Record<string, string> = {
	'/': 'Dashboard',
	'/questions': 'Questions',
	'/topics': 'Topics',
	'/progress': 'Progress',
	'/analytics': 'Analytics',
	'/profile': 'Profile',
	'/manage': 'Manage',
}

export function AppLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const { theme, toggleTheme } = useTheme()
	const { pathname } = useLocation()
	const pageTitle = pageTitles[pathname] ?? 'Questions'

	return (
		<div className="app-shell">
			<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
			{sidebarOpen && (
				<button
					className="sidebar-overlay"
					onClick={() => setSidebarOpen(false)}
					aria-label="Close navigation"
				/>
			)}
			<div className="main-area">
				<Topbar
					theme={theme}
					pageTitle={pageTitle}
					onMenuOpen={() => setSidebarOpen(true)}
					onThemeToggle={toggleTheme}
				/>
				<main className="page-content">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
