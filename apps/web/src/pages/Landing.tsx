import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <div className="section-eyebrow">Low Level Lab</div>
          <h1 className="section-title max-w-3xl">Learn systems programming by solving problems, not reading chapters.</h1>
          <p className="section-copy">
            A clean starting point for the product: ordered tracks, short briefs, and a UI that keeps the focus on the work.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" to="/topics">
              Start learning
            </Link>
            <Link className="pill-link" to="/dashboard">
              View dashboard
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="stat-chip">9 ordered tracks</span>
            <span className="stat-chip">8 question formats</span>
            <span className="stat-chip">Keyboard-first flow</span>
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow mb-2">Continue</p>
              <h2 className="text-2xl font-semibold tracking-tight">Integer promotion rules</h2>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--surface-2)] text-sm font-semibold text-[color:var(--accent)]">
              19
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4 text-sm text-[color:var(--muted)]">
              MCQ · C fundamentals
            </div>
            <div className="rounded-3xl bg-[color:var(--ink)] p-5 text-white shadow-[0_20px_50px_rgba(26,26,26,0.16)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Progress</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[43%] rounded-full bg-[color:var(--accent-btn)]" />
              </div>
              <p className="mt-3 text-sm text-white/75">37 of 272 solved · 5-day streak</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Ordered path", "One topic leads to the next. No catalog sprawl."],
          ["Short briefs", "Each problem explains just enough to start."],
          ["Clear feedback", "Wrong answers get a reason, not a scolding."],
        ].map(([title, copy]) => (
          <div key={title} className="surface-card p-5">
            <h3 className="mb-2 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-sm leading-6 text-[color:var(--muted)]">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
