import { Menu, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Topbar({
	darkMode,
	onMenuOpen,
	onThemeToggle,
	pageTitle,
}: {
	darkMode: boolean
	onMenuOpen: () => void
	onThemeToggle: () => void
	pageTitle: string
}) {
	return (
		<header className="topbar">
			<button className="icon-button menu-button" onClick={onMenuOpen} aria-label="Open menu">
				<Menu size={20} />
			</button>
			<div><span className="breadcrumb">LOW LEVEL LAB — REFERENCE MANUAL SPECIFICATION</span><strong className="topbar-page"> / {pageTitle}</strong></div>
			<div className="topbar-actions">
				<button className="icon-button" onClick={onThemeToggle} aria-label="Toggle color theme">
					{darkMode ? <Sun size={18} /> : <Moon size={18} />}
				</button>
				<Link className="profile-avatar" to="/auth">ML</Link>
			</div>
		</header>
	)
}
