import { Link } from "react-router-dom";

export default function Search() {
	return (
		<section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-8">
				<div className="section-eyebrow">Search</div>
				<h1 className="section-title mt-3 text-4xl">Search questions and tracks</h1>
				<p className="section-copy mt-4">A first-pass search page with the same warm surface treatment as the rest of the app.</p>
			</div>

			<div className="surface-card p-6 sm:p-8">
				<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
					<span>Search</span>
					<input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="search" placeholder="e.g. pointers, printf, syscalls" />
				</label>
				<div className="mt-5 flex flex-wrap gap-3">
					{["pointers", "popcount", "syscalls"].map((tag) => <span key={tag} className="stat-chip">{tag}</span>)}
				</div>
				<div className="mt-6 space-y-3">
					{[
						["Pointers & memory", "Track · 7 / 38 solved"],
						["What does %zu print?", "Question · MCQ · easy"],
						["Syscalls & the OS", "Track · 0 / 29 solved"],
					].map(([title, meta]) => (
						<div key={title as string} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] px-4 py-4">
							<h2 className="text-lg font-semibold tracking-tight">{title as string}</h2>
							<p className="mt-1 text-sm text-[color:var(--muted)]">{meta as string}</p>
						</div>
					))}
				</div>
		</div>

			<div className="mt-5 flex justify-end">
				<Link className="pill-link" to="/topics">Browse tracks</Link>
			</div>
		</section>
	);
}