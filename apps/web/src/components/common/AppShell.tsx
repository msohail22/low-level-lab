import { Link, NavLink } from "react-router-dom";

const navItems = [
	{ to: "/", label: "Home" },
	{ to: "/topics", label: "Learn" },
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/settings", label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen text-slate-900">
			<header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-xl">
				<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<Link to="/" className="flex items-center gap-3">
						<span className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--accent-btn)] text-sm font-black uppercase tracking-[0.22em] text-white shadow-[0_14px_30px_rgba(168,65,36,0.28)]">
							LL
						</span>
						<span>
							<span className="block text-sm font-black uppercase tracking-[0.26em] text-[color:var(--accent)]">
								Low Level Lab
							</span>
							<span className="block text-xs text-[color:var(--muted)]">
								Systems learning, designed simply.
							</span>
						</span>
					</Link>

					<nav className="hidden items-center gap-2 md:flex">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.to === "/"}
								className={({ isActive }) =>
									[
										"rounded-full px-4 py-2 text-sm font-medium transition",
										isActive
											? "bg-[color:var(--ink)] text-white shadow-[0_10px_24px_rgba(26,26,26,0.12)]"
											: "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]",
									].join(" ")
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>
				</div>
			</header>

			<main>{children}</main>

				<footer className="border-t border-[color:var(--line)] bg-[color:var(--bg)]/70">
					<div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[color:var(--muted)] sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
						<p>Low Level Lab · free systems programming practice</p>
						<div className="flex flex-wrap gap-3">
							<Link className="pill-link !px-3 !py-2 !text-xs" to="/topics">
								Learn
							</Link>
							<Link className="pill-link !px-3 !py-2 !text-xs" to="/dashboard">
								Dashboard
							</Link>
							<Link className="pill-link !px-3 !py-2 !text-xs" to="/settings">
								Settings
							</Link>
						</div>
					</div>
			</footer>
		</div>
	);
}