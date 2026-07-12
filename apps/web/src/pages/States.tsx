import { Link } from "react-router-dom";

export default function States() {
	return (
		<section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-8">
				<div className="section-eyebrow">States</div>
				<h1 className="section-title mt-3 text-4xl">UI states</h1>
				<p className="section-copy mt-4">The non-happy-path screens get the same calm treatment as the main pages.</p>
			</div>

			<div className="grid gap-5 md:grid-cols-2">
				{[
					["Loading", "Skeletons while content hydrates."],
					["Error", "Inline retry instead of a dead end."],
					["Empty", "Helpful guidance when nothing is there yet."],
					["Success", "A clear confirmation and next step."],
				].map(([title, copy]) => (
					<div key={title as string} className="surface-card p-6">
						<p className="section-eyebrow">State</p>
						<h2 className="mt-3 text-2xl font-semibold tracking-tight">{title as string}</h2>
						<p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{copy as string}</p>
					</div>
				))}
			</div>

			<div className="mt-5 flex justify-end">
				<Link className="pill-link" to="/search">Open search</Link>
			</div>
		</section>
	);
}