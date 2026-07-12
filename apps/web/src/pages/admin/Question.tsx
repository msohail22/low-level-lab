export default function AdminQuestion() {
	return (
		<section className="mx-auto w-full max-w-7xl">
			<div className="mb-8">
				<div className="section-eyebrow">New question</div>
				<h1 className="section-title mt-3 text-4xl">Author a question</h1>
				<p className="section-copy mt-4">Pick a format and the fields below adapt to it. Every question needs an explanation, and hints are recommended.</p>
			</div>

			<div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
				<div className="surface-card p-6 sm:p-8 space-y-5">
					<div>
						<p className="section-eyebrow">Basics</p>
						<div className="mt-4 grid gap-4 md:grid-cols-2">
							{["Topic", "Difficulty", "Format", "Title"].map((field) => (
								<label key={field} className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
									<span>{field}</span>
									<input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="text" placeholder="Select or type" />
								</label>
							))}
						</div>
					</div>
					<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
						<span>Prompt / brief</span>
						<textarea className="min-h-40 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" placeholder="The question text learners see." />
					</label>
				</div>

				<div className="surface-card p-6 sm:p-8 space-y-5">
					<div>
						<p className="section-eyebrow">Answer setup</p>
						<div className="mt-4 space-y-3">
							{[
								"Code playground",
								"Guess the output",
								"Multiple choice",
								"Multi-select",
								"Fill the blank",
								"Find the bug",
								"Predict state",
								"Hex / binary drill",
							].map((item, index) => (
								<div key={item} className={`rounded-2xl border px-4 py-3 text-sm ${index === 0 ? "border-[color:var(--accent)] bg-[color:var(--surface-2)] text-[color:var(--ink)]" : "border-[color:var(--line)] bg-white text-[color:var(--muted)]"}`}>{item}</div>
							))}
						</div>
					</div>
					<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
						<span>Explanation</span>
						<textarea className="min-h-32 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" placeholder="Why the answer is what it is." />
					</label>
					<div className="grid gap-4 md:grid-cols-2">
						<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
							<span>Hint 1</span>
							<input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="text" placeholder="A nudge" />
						</label>
						<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
							<span>Hint 2</span>
							<input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="text" placeholder="More specific" />
						</label>
					</div>
					<div className="flex flex-wrap gap-3 pt-2">
						<button className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">Publish</button>
						<button className="pill-link" type="button">Save draft</button>
					</div>
				</div>
			</div>
		</section>
	);
}