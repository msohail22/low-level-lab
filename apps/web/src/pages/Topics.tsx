export default function Topics() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="section-eyebrow">Learn</div>
        <h1 className="section-title mt-3 text-4xl">Ordered tracks with clear progress</h1>
        <p className="section-copy mt-4">
          Start with the first track and move forward in sequence. This first pass uses the same warm editorial look across the site.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["C fundamentals", "18 / 42 solved"],
          ["Pointers & memory", "7 / 38 solved"],
          ["Bit manipulation", "6 / 35 solved"],
          ["x86-64 assembly", "4 / 44 solved"],
          ["Stack & calling conventions", "2 / 26 solved"],
          ["Heap allocators", "0 / 18 solved"],
        ].map(([name, progress]) => (
          <div key={name} className="surface-card p-6">
            <p className="section-eyebrow mb-4">Track</p>
            <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">{progress}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
              <div className="h-full w-[43%] rounded-full bg-[color:var(--accent-btn)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
