import { Link } from "react-router-dom";

export default function AdminDashboard() {
	return (
		<section className="mx-auto w-full max-w-7xl">
			<div className="mb-8">
				<div className="section-eyebrow">Authoring</div>
				<h1 className="section-title mt-3 text-4xl">Dashboard</h1>
				<p className="section-copy mt-4">Curated content overview. Topics and questions are managed here while the public path stays ordered.</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{[
					["9", "Topics live"],
					["272", "Questions live"],
					["6", "Drafts"],
					["4", "In review"],
				].map(([value, label], index) => (
					<div key={label} className="surface-card p-6">
						<div className={`text-4xl font-semibold tracking-tight ${index === 3 ? "text-[color:var(--accent)]" : "text-[color:var(--ink)]"}`}>{value}</div>
						<p className="mt-2 text-sm text-[color:var(--muted)]">{label}</p>
					</div>
				))}
			</div>

			<div className="surface-card mt-5 p-6 sm:p-8">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<h2 className="text-2xl font-semibold tracking-tight">Recent activity</h2>
					<div className="flex flex-wrap gap-3">
						<Link className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" to="/admin/question">＋ New question</Link>
						<Link className="pill-link" to="/admin/topics">＋ New topic</Link>
					</div>
				</div>
				<div className="mt-6 overflow-hidden rounded-3xl border border-[color:var(--line)]">
					<table className="w-full border-collapse text-left text-sm">
						<thead className="bg-[color:var(--surface-2)] text-[color:var(--muted)]">
							<tr>
								{["Item", "Topic", "Format", "Status", "Updated"].map((head) => (
									<th key={head} className="px-4 py-3 font-medium">{head}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{[
								["Integer promotion rules", "C fundamentals", "MCQ", "Live", "2h ago"],
								["Aligned allocation wrapper", "Pointers & memory", "Coding", "Draft", "Yesterday"],
								["Cache line false sharing", "Caches & perf", "Predict state", "In review", "Yesterday"],
								["Two's complement negate", "Bit manipulation", "Hex/binary", "Live", "2d ago"],
							].map((row, index) => (
								<tr key={row[0]} className={index % 2 === 0 ? "bg-white" : "bg-[color:var(--surface-2)]"}>
									<td className="px-4 py-3 font-medium text-[color:var(--ink)]">{row[0]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[1]}</td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[2]}</td>
									<td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${row[3] === "Live" ? "bg-[color:rgba(46,125,50,0.12)] text-[color:var(--ok)]" : row[3] === "Draft" ? "bg-[color:rgba(168,65,36,0.1)] text-[color:var(--accent)]" : "bg-[color:rgba(168,65,36,0.08)] text-[color:var(--accent)]"}`}>{row[3]}</span></td>
									<td className="px-4 py-3 text-[color:var(--muted)]">{row[4]}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}