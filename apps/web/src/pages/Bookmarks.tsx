import { Link } from "react-router-dom";

export default function Bookmarks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="section-eyebrow">Saved</div>
        <h1 className="section-title mt-3 text-4xl">Bookmarks</h1>
        <p className="section-copy mt-4">A quiet place for problems and tracks you want to revisit later.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Saved questions</h2>
            <span className="stat-chip">6 saved</span>
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["Integer promotion rules", "MCQ · C fundamentals"],
              ["Detect a use-after-free", "Bug · Pointers & memory"],
              ["Fork and wait", "Coding · Syscalls"],
            ].map(([title, meta]) => (
              <div key={title} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4">
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{meta}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow">Continue</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Pick up where you left off</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Bookmarks should support review, not create clutter. Keep the list short and intentional.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" to="/question/19">
              Open current question
            </Link>
            <Link className="pill-link" to="/topics">
              Browse tracks
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
