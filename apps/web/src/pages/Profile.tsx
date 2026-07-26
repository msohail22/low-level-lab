export default function Profile() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="section-eyebrow">Account</div>
        <h1 className="section-title mt-3 text-4xl">Profile</h1>
        <p className="section-copy mt-4">A compact view of progress, identity, and a few meaningful achievements.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-[color:var(--ink)] text-white">HO</div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">heap-otter-7</h2>
              <p className="text-sm text-[color:var(--muted)]">Signed in · Streak 5 days</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-2)] px-4 py-3"><span className="text-sm text-[color:var(--muted)]">Solved</span><strong>37 / 272</strong></div>
            <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-2)] px-4 py-3"><span className="text-sm text-[color:var(--muted)]">Current track</span><strong>C fundamentals</strong></div>
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow">Achievements</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["First blood", "Solved your first problem"],
              ["5-day streak", "Practiced 5 days running"],
              ["Track master", "Finish any full track"],
              ["No hints", "Solve 20 in a row hint-free"],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-2)] p-4">
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
