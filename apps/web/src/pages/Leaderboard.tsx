export default function Leaderboard() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="section-eyebrow">Community</div>
        <h1 className="section-title mt-3 text-4xl">Leaderboard</h1>
        <p className="section-copy mt-4">A simple ranking page for motivation and social proof, without feeling loud or gamified.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-6 sm:p-8">
          <div className="space-y-3">
            {[
              ["heap-otter-7", "2,410 XP", 1],
              ["stack-sparrow", "1,980 XP", 2],
              ["null-architect", "1,744 XP", 3],
              ["byte-cadet", "1,410 XP", 4],
            ].map(([name, xp, rank]) => (
              <div key={name as string} className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] px-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-bold text-[color:var(--accent)]">#{rank as number}</div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">{name as string}</h2>
                    <p className="text-sm text-[color:var(--muted)]">Weekly points</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[color:var(--ink)]">{xp as string}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow">Your position</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Rank 12</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Your current streak and solved count still place you comfortably in the middle of the board.</p>
          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-2)] px-4 py-3"><span className="text-sm text-[color:var(--muted)]">Solved</span><strong>37</strong></div>
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-2)] px-4 py-3"><span className="text-sm text-[color:var(--muted)]">Streak</span><strong>5 days</strong></div>
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-2)] px-4 py-3"><span className="text-sm text-[color:var(--muted)]">XP</span><strong>1,240</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}
