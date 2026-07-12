import { Link, useParams } from "react-router-dom";

export default function Question() {
  const { questionId } = useParams();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3 text-sm text-[color:var(--muted)]">
        <Link className="text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/topics">C fundamentals</Link>
        <span>·</span>
        <span>Question {questionId ?? "19"}</span>
        <span>·</span>
        <span>MCQ</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-card p-6 sm:p-8">
          <div className="section-eyebrow">Question</div>
          <h1 className="section-title mt-3 text-4xl">Integer promotion rules</h1>
          <p className="section-copy mt-4">Given <code>char a = 200; char b = 100;</code> on a platform with signed <code>char</code>, what type does <code>a + b</code> evaluate to?</p>
          <div className="mt-8 space-y-3">
            {["char", "int", "unsigned char", "undefined"].map((option, index) => (
              <button key={option} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${index === 1 ? "border-[color:var(--accent)] bg-[color:var(--surface-2)]" : "border-[color:var(--line)] bg-white hover:border-[color:var(--accent)]/30"}`} type="button">
                <span className="font-medium">{option}</span>
                {index === 1 ? <span className="text-sm font-semibold text-[color:var(--accent)]">Correct</span> : null}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="pill-link !bg-[color:var(--accent-btn)] !text-white !border-transparent" type="button">Submit answer</button>
            <button className="pill-link" type="button">Hint</button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-card p-6 sm:p-8">
            <p className="section-eyebrow">Why</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Both <code>char</code>s promote to <code>int</code>, so the arithmetic happens at <code>int</code> precision. This mirrors the problem brief from the HTML mockup.</p>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <p className="section-eyebrow">Next</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Complete the swap function</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Keep the path moving with the next item in the track.</p>
            <Link className="pill-link mt-5" to="/question/20">Next question →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
