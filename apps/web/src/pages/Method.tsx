import { Link } from "react-router-dom";

export default function Method() {
	return (
		<section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-8">
				<div className="section-eyebrow">Method</div>
				<h1 className="section-title mt-3 text-4xl">Read, solve, verify.</h1>
				<p className="section-copy mt-4">The learning flow stays short and explicit: a brief, a problem, and a checker.</p>
			</div>

			<div className="grid gap-5 md:grid-cols-3">
				{[
					["Read", "A short brief that tells you exactly enough to start."],
					["Solve", "A focused question or coding task with a clear goal."],
					["Verify", "A result, explanation, or next step once you answer."],
				].map(([title, copy], index) => (
					<div key={title} className="surface-card p-6">
						<p className="section-eyebrow">0{index + 1}</p>
						<h2 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
						<p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{copy}</p>
					</div>
				))}
			</div>

			<div className="surface-card mt-5 p-6 sm:p-8">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="section-eyebrow">FAQ</p>
						<h2 className="mt-3 text-2xl font-semibold tracking-tight">The product stays intentionally narrow.</h2>
					</div>
					<Link className="pill-link" to="/topics">Browse tracks</Link>
				</div>
				<div className="mt-6 grid gap-3 md:grid-cols-2">
					{[
						"Problems are ordered, not a free-form catalog.",
						"Early questions stay browser-friendly for lower friction.",
						"Later coding tasks are meant for a local harness.",
						"Every wrong answer should explain why it is wrong.",
					].map((item) => (
						<div key={item} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] px-4 py-4 text-sm leading-6 text-[color:var(--muted)]">{item}</div>
					))}
				</div>
			</div>
		</section>
	);
}