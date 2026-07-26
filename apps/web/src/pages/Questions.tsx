export default function Questions() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="section-eyebrow">Question list</div>
        <h1 className="section-title mt-3 text-4xl">Questions</h1>
        <p className="section-copy mt-4">A simple list view for browsing the current path before the finer filter experience is wired in.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow">Filters</p>
          <div className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
            <div className="rounded-2xl bg-[color:var(--surface-2)] px-4 py-3">Format · All</div>
            <div className="rounded-2xl bg-[color:var(--surface-2)] px-4 py-3">Difficulty · Medium</div>
            <div className="rounded-2xl bg-[color:var(--surface-2)] px-4 py-3">Status · Unsolved only</div>
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <div className="space-y-3">
            {[
              ["Integer promotion rules", "MCQ · medium"],
              ["Complete the swap function", "Fill blank · medium"],
              ["Spot the off-by-one", "Find bug · medium"],
              ["What does %zu print?", "MCQ · easy"],
            ].map(([title, meta], index) => (
              <div key={title} className={`rounded-2xl border px-4 py-4 ${index === 0 ? "border-[color:var(--accent)] bg-[color:var(--surface-2)]" : "border-[color:var(--line)] bg-white"}`}>
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{meta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
