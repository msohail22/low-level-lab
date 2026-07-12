export default function History() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="section-eyebrow">Recent work</div>
        <h1 className="section-title mt-3 text-4xl">History</h1>
        <p className="section-copy mt-4">A chronological view of what the learner has done lately, styled to match the rest of the product.</p>
      </div>

      <div className="surface-card p-6 sm:p-8">
        <div className="space-y-4">
          {[
            ["Sum of an int array", "Solved · 2h ago", true],
            ["Reverse bits of a word", "Solved · Yesterday", true],
            ["What does %zu print?", "Viewed · Yesterday", false],
            ["Integer promotion rules", "Attempted · Yesterday", false],
          ].map(([title, meta, done]) => (
            <div key={title as string} className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] px-4 py-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{title as string}</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{meta as string}</p>
              </div>
              <span className="stat-chip">{done ? "Solved" : "Seen"}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
