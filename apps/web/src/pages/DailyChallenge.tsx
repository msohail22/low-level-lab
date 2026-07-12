import { Link } from "react-router-dom";

export default function DailyChallenge() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="surface-card overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="section-eyebrow">Daily challenge</div>
            <h1 className="section-title mt-3 text-4xl">One focused problem for today.</h1>
            <p className="section-copy mt-4">A small daily target keeps the product feeling active without turning it into a grind.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" to="/question/19">Start challenge</Link>
              <Link className="pill-link" to="/dashboard">View progress</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface-2)] p-5 sm:p-6">
            <p className="section-eyebrow">Today</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Reverse bits of a word</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">A short challenge with a clear start, clear answer, and clear feedback.</p>
            <div className="mt-5 space-y-3 text-sm text-[color:var(--muted)]">
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"><span>Difficulty</span><strong className="text-[color:var(--ink)]">Medium</strong></div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"><span>Reward</span><strong className="text-[color:var(--ink)]">+10 XP</strong></div>
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"><span>Streak bonus</span><strong className="text-[color:var(--ink)]">Active</strong></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
