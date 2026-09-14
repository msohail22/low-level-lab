import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from '@components/layout/Sidebar'
import { Topbar } from '@components/layout/Topbar'

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
	const [darkMode, setDarkMode] = useState(false)
	const { pathname } = useLocation()
	const pageTitle = pageTitles[pathname] ?? 'Questions'

	return (
		<div className={`app-shell ${darkMode ? 'dark' : ''}`}>
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
					darkMode={darkMode}
					pageTitle={pageTitle}
					onMenuOpen={() => setSidebarOpen(true)}
					onThemeToggle={() => setDarkMode((current) => !current)}
				/>
				<main className="page-content">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
