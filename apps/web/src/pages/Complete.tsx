import { Link } from "react-router-dom";

export default function Complete() {
	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="surface-card p-6 sm:p-8 lg:p-10 text-center">
				<div className="section-eyebrow">Track complete</div>
				<h1 className="section-title mt-3 text-4xl">You finished a track.</h1>
				<p className="section-copy mx-auto mt-4">The celebration screen stays simple, with the next action still visually obvious.</p>
				<div className="mt-8 grid gap-4 md:grid-cols-3">
					{[
						["Solved", "42"],
						["Time", "6.2h"],
						["Accuracy", "88%"],
					].map(([label, value]) => (
						<div key={label as string} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4">
							<p className="text-sm text-[color:var(--muted)]">{label as string}</p>
							<div className="mt-2 text-3xl font-semibold tracking-tight">{value as string}</div>
						</div>
					))}
				</div>
				<div className="mt-8 flex flex-wrap justify-center gap-3">
					<Link className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" to="/topics">Next track</Link>
					<Link className="pill-link" to="/track">Review track</Link>
				</div>
			</div>
		</section>
	);
}