import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const adminNav = [
	{ to: "/admin", label: "Dashboard" },
	{ to: "/admin/topics", label: "Topics" },
	{ to: "/admin/question", label: "New question" },
	{ to: "/admin/review", label: "Review queue" },
];

type AdminShellProps = {
	children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
	return (
		<div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--ink)] lg:grid lg:grid-cols-[280px_1fr]">
			<aside className="border-b border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-6 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-5">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<span className="grid h-10 w-10 place-items-center rounded-2xl bg-[color:var(--accent-btn)] text-sm font-black uppercase tracking-[0.2em] text-white">LL</span>
						<div>
							<p className="text-sm font-black uppercase tracking-[0.24em] text-[color:var(--accent)]">Low Level Lab</p>
							<p className="text-xs text-[color:var(--muted)]">Authoring</p>
						</div>
					</div>
					<p className="section-eyebrow pt-3">Admin</p>
				</div>

				<nav className="mt-6 space-y-2">
					{adminNav.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === "/admin"}
							className={({ isActive }) =>
								[
									"block rounded-2xl px-4 py-3 text-sm font-medium transition",
									isActive
										? "bg-[color:var(--ink)] text-white shadow-[0_10px_24px_rgba(26,26,26,0.12)]"
										: "border border-transparent text-[color:var(--muted)] hover:border-[color:var(--line)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]",
								].join(" ")
							}
						>
							{item.label}
						</NavLink>
					))}
				</nav>

				<div className="mt-8 rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4 text-sm text-[color:var(--muted)]">
					<p className="font-semibold text-[color:var(--ink)]">Back to the site</p>
					<p className="mt-2 leading-6">The learner-facing app stays separate from authoring and moderation.</p>
					<Link className="mt-3 inline-flex text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/">
						Open public site
					</Link>
				</div>
			</aside>

			<main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
		</div>
	);
}