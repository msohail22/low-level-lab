import { BookOpen, ChevronRight, CircleHelp, Code2, FilePlus2, LayoutDashboard, ShieldCheck, Settings2, Target, UsersRound, X } from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const navItems = [
	{ label: 'Dashboard', path: '/', icon: LayoutDashboard },
	{ label: 'Questions', path: '/questions', icon: CircleHelp },
	{ label: 'Topics', path: '/topics', icon: BookOpen },
	{ label: 'Progress', path: '/progress', icon: Target },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
	const { data: session, isPending } = useAuth()
	const name = session?.user?.name ?? 'My Learning'
	const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
	return (
		<aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
			<div className="brand">
				<div className="brand-mark">L</div>
				<div>
					<strong>Low Level Lab</strong>
					<span>Learn by understanding</span>
				</div>
				<button className="icon-button close-sidebar" onClick={onClose} aria-label="Close menu">
					<X size={18} />
				</button>
			</div>
			<nav className="main-nav" aria-label="Main navigation">
				<span className="nav-label">Workspace</span>
				{navItems.map(({ label, path, icon: Icon }) => (
					<NavLink
						className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
						end={path === '/'}
						key={path}
						onClick={onClose}
						to={path}
					>
						<Icon size={18} />
						{label}
					</NavLink>
				))}
				<span className="nav-label nav-label-spaced">Content workspace</span>
				<NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manage?view=submit" onClick={onClose}><FilePlus2 size={18} />Submit a question</NavLink>
				<NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manage?view=review" onClick={onClose}><ShieldCheck size={18} />Review questions</NavLink>
				<NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manage?view=admin" onClick={onClose}><ShieldCheck size={18} />Admin moderation</NavLink>
				<NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manage?view=topics" onClick={onClose}><Settings2 size={18} />Manage topics</NavLink>
				<NavLink className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} to="/manage?view=super-admin" onClick={onClose}><UsersRound size={18} />Super admin</NavLink>
				<span className="nav-label nav-label-spaced">Coming soon</span>
				<div className="nav-item disabled">
					<Code2 size={18} />
					Coding Questions
					<span className="soon-pill">Soon</span>
				</div>
			</nav>
			<div className="sidebar-footer">
				<div className="profile-chip">
					<div className="avatar">{initials || 'ML'}</div>
					<div>
						<strong>{isPending ? 'Loading profile…' : name}</strong>
						<span>{session?.user?.email ?? 'Guest workspace'}</span>
					</div>
				</div>
				<Link className="settings-link" to="/auth">
					{session?.user ? 'Account settings' : 'Sign in to sync progress'} <ChevronRight size={15} />
				</Link>
			</div>
		</aside>
	)
}
