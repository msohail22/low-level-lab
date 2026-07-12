export default function Dashboard() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="section-eyebrow">Dashboard</div>
          <h1 className="section-title mt-3 text-4xl">Your current learning path</h1>
        </div>
        <p className="hidden max-w-sm text-sm text-[color:var(--muted)] md:block">
          A lightweight dashboard placeholder with a clearer visual language. We can expand the cards and metrics later.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow mb-4">Continue</p>
          <h2 className="text-2xl font-semibold tracking-tight">Integer promotion rules</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
            A small, readable layout for the first design pass. This card will become the continuing-problem module once the full data wiring is in place.
          </p>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
            <div className="h-full w-[43%] rounded-full bg-[color:var(--accent-btn)]" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {[
            ["Solved", "37 / 272"],
            ["Streak", "5 days"],
          ].map(([label, value]) => (
            <div key={label} className="surface-card p-6">
              <p className="text-sm font-medium text-[color:var(--muted)]">{label}</p>
              <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
