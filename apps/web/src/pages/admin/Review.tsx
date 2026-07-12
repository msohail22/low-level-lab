import { Link } from "react-router-dom";

export default function AdminReview() {
	return (
		<section className="mx-auto w-full max-w-7xl">
			<div className="mb-8">
				<div className="section-eyebrow">Moderation</div>
				<h1 className="section-title mt-3 text-4xl">Review queue</h1>
				<p className="section-copy mt-4">Community-suggested questions are moderated here before they ever reach the public path.</p>
			</div>

			<div className="surface-card p-6 sm:p-8">
				<div className="overflow-hidden rounded-3xl border border-[color:var(--line)]">
					<table className="w-full border-collapse text-left text-sm">
						<thead className="bg-[color:var(--surface-2)] text-[color:var(--muted)]">
							<tr>
								{["Suggested question", "By", "Topic", "Format", "Votes", ""].map((head) => (
									<th key={head || "spacer"} className="px-4 py-3 font-medium">{head}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{[
								["Strict aliasing violation", "@devon", "Pointers & memory", "Guess output", "+12"],
								["popcount without builtins", "@mira", "Bit manipulation", "Coding", "+8"],
								["Stack canary purpose", "@kt", "Stack & calling", "MCQ", "+3"],
							].map((row, index) => (
								<tr key={row[0]} className={index % 2 === 0 ? "bg-white" : "bg-[color:var(--surface-2)]"}>
									<td className="px-4 py-3 font-medium text-[color:var(--ink)]">{row[0]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[1]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[2]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[3]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[4]}</td>
									<td className="px-4 py-3"><Link className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/admin/review">Review</Link></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="mt-6 rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-5">
					<p className="section-eyebrow">Reviewing</p>
					<h2 className="mt-3 text-2xl font-semibold tracking-tight">Strict aliasing violation</h2>
					<p className="mt-2 text-sm text-[color:var(--muted)]">In review · by @devon · Guess the output · suggested for Pointers & memory</p>
					<div className="mt-4 rounded-2xl bg-white p-4 font-mono text-sm leading-6 text-[color:var(--ink)]">float f = 1.0f;<br />int *p = (int*)&amp;f;<br />printf("%d\n", *p);</div>
					<p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">Contributor note: “Tests whether they spot the aliasing UB vs assuming a bit-reinterpret.”</p>
					<div className="mt-5 grid gap-4 md:grid-cols-2">
						<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
							<span>Assign to topic</span>
							<input className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" type="text" value="Pointers & memory" readOnly />
						</label>
						<label className="block space-y-2 text-sm font-medium text-[color:var(--ink)]">
							<span>Reviewer note</span>
							<textarea className="min-h-32 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]" placeholder="Optional feedback" />
						</label>
					</div>
					<div className="mt-5 flex flex-wrap gap-3">
						<button className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">Approve & publish</button>
						<button className="pill-link" type="button">Request changes</button>
						<button className="pill-link" type="button">Reject</button>
					</div>
				</div>
			</div>
		</section>
	);
}