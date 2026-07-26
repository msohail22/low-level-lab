import { Link } from "react-router-dom";

export default function Formats() {
	return (
		<section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-8">
				<div className="section-eyebrow">Gallery</div>
				<h1 className="section-title mt-3 text-4xl">Question formats</h1>
				<p className="section-copy mt-4">A compact overview of the eight interaction styles described in the HTML mockups.</p>
			</div>

			<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{[
					["Coding", "Write code in the browser or locally."],
					["Guess output", "Read a snippet and predict stdout."],
					["MCQ", "Pick one exact answer."],
					["Multi-select", "Select every correct option."],
					["Fill blank", "Complete the missing code or value."],
					["Find bug", "Locate the defect in a snippet."],
					["Predict state", "Reason about registers or memory."],
					["Hex / binary", "Convert between number formats."],
				].map(([title, copy]) => (
					<div key={title} className="surface-card p-6">
						<p className="section-eyebrow">Format</p>
						<h2 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
						<p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{copy}</p>
					</div>
				))}
			</div>

			<div className="mt-5 flex justify-end">
				<Link className="pill-link" to="/states">See UI states</Link>
			</div>
		</section>
	);
}