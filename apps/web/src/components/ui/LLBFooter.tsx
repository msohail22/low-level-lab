import { Link } from "react-router-dom";

export default function LLBFooter() {
	return (
		<footer className="mt-auto border-t border-[color:var(--line)] bg-[color:var(--bg)]/70">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[color:var(--muted)] sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
				<p>Low Level Lab · free systems programming practice</p>
				<div className="flex flex-wrap gap-3">
					<Link className="pill-link !px-3 !py-2 !text-xs" to="/topics">Learn</Link>
					<Link className="pill-link !px-3 !py-2 !text-xs" to="/method">Method</Link>
					<Link className="pill-link !px-3 !py-2 !text-xs" to="/search">Search</Link>
					<Link className="pill-link !px-3 !py-2 !text-xs" to="/settings">Settings</Link>
				</div>
			</div>
		</footer>
	);
}