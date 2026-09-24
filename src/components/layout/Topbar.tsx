import { Menu, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Theme } from '@hooks/useTheme'
import { useAuth } from '@hooks/useAuth'

export function Topbar({
	theme,
	onMenuOpen,
	onThemeToggle,
	pageTitle,
}: {
	theme: Theme
	onMenuOpen: () => void
	onThemeToggle: () => void
	pageTitle: string
}) {
	const { data: session } = useAuth()
	const name = session?.user?.name ?? ''
	const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
	const isDark = theme === 'dark'

	return (
		<header className="topbar">
			<button className="icon-button menu-button" onClick={onMenuOpen} aria-label="Open menu">
				<Menu size={20} />
			</button>
			<div>
				<span className="breadcrumb">Low Level Lab</span>
				<strong className="topbar-page"> / {pageTitle}</strong>
			</div>
			<div className="topbar-actions">
				<button
					className="icon-button"
					onClick={onThemeToggle}
					aria-label={isDark ? 'Switch to the light faceplate' : 'Switch to the dark chassis'}
				>
					{isDark ? <Sun size={18} /> : <Moon size={18} />}
				</button>
				<Link className="profile-avatar" to="/profile" aria-label="Your profile">
					{initials || 'LL'}
				</Link>
			</div>
		</header>
	)
}
