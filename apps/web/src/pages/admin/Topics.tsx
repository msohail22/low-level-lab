export default function AdminTopics() {
	return (
		<section className="mx-auto w-full max-w-7xl">
			<div className="mb-8">
				<div className="section-eyebrow">Content</div>
				<h1 className="section-title mt-3 text-4xl">Topics</h1>
				<p className="section-copy mt-4">Drag to reorder the canonical path. Order defines the learner sequence, and only admins create topics.</p>
			</div>

			<div className="surface-card p-6 sm:p-8">
				<div className="flex justify-end">
					<button className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">＋ New topic</button>
				</div>

				<div className="mt-6 overflow-hidden rounded-3xl border border-[color:var(--line)]">
					<table className="w-full border-collapse text-left text-sm">
						<thead className="bg-[color:var(--surface-2)] text-[color:var(--muted)]">
							<tr>
								{["", "#", "Topic", "Scope", "Questions", "Difficulty mix", "Status", ""].map((head) => (
									<th key={head || "spacer"} className="px-4 py-3 font-medium">{head}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{[
								["01", "C fundamentals", "types, control flow, I/O", "42", "Intro→Hard", "Live"],
								["02", "Pointers & memory", "aliasing, lifetimes, UB", "38", "Easy→Hard", "Live"],
								["03", "Bit manipulation", "masks, shifts", "35", "Easy→Medium", "Live"],
								["10", "Concurrency & atomics", "threads, memory order", "0", "—", "Draft"],
							].map((row, index) => (
								<tr key={row[1]} className={index % 2 === 0 ? "bg-white" : "bg-[color:var(--surface-2)]"}>
									<td className="px-4 py-3 text-[color:var(--muted)]">⠿</td>
									<td className="px-4 py-3 font-medium text-[color:var(--ink)]">{row[0]}</td>
									<td className="px-4 py-3 font-semibold text-[color:var(--ink)]">{row[1]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[2]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[3]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[4]}</td>
									<td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row[5] === "Live" ? "bg-[color:rgba(46,125,50,0.12)] text-[color:var(--ok)]" : "bg-[color:rgba(168,65,36,0.1)] text-[color:var(--accent)]"}`}>{row[5]}</span></td>
									<td className="px-4 py-3 text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4">Edit</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="mt-6 rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-5">
					<p className="section-eyebrow">New / edit topic</p>
					<div className="mt-4 grid gap-4 md:grid-cols-2">
						{[
							"Name",
							"Order position",
							"Scope",
							"Difficulty ramp",
							"Visibility",
						].map((field) => (
							<label key={field} className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
								<span>{field}</span>
								<input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="text" placeholder="Enter value" />
							</label>
						))}
					</div>
					<div className="mt-5 flex flex-wrap gap-3">
						<button className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">Save topic</button>
						<button className="pill-link" type="button">Save as draft</button>
					</div>
				</div>
			</div>
		</section>
	);
}