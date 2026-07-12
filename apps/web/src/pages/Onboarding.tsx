import { Link } from "react-router-dom";

export default function Onboarding() {
	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="surface-card p-6 sm:p-8 lg:p-10">
				<div className="section-eyebrow">Onboarding</div>
				<h1 className="section-title mt-3 text-4xl">Pick a starting point.</h1>
				<p className="section-copy mt-4">A simple first-run screen based on the HTML mockup, kept light and non-committal for now.</p>
				<div className="mt-8 grid gap-4 md:grid-cols-3">
					{[
						["Goal", "Learn the basics", true],
						["Level", "Some C experience", false],
						["Start", "C fundamentals", false],
					].map(([title, copy, active]) => (
						<div key={title as string} className={`rounded-2xl border p-4 ${active ? "border-[color:var(--accent)] bg-[color:var(--surface-2)]" : "border-[color:var(--line)] bg-white"}`}>
							<p className="section-eyebrow">{title as string}</p>
							<p className="mt-3 text-sm text-[color:var(--muted)]">{copy as string}</p>
						</div>
					))}
				</div>
				<div className="mt-8 flex flex-wrap gap-3">
					<Link className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" to="/topics">Continue</Link>
					<Link className="pill-link" to="/dashboard">Skip for now</Link>
				</div>
			</div>
		</section>
	);
}