import { Link, useParams } from "react-router-dom";

export default function TopicDetails() {
  const { topicId } = useParams();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link className="text-sm text-[color:var(--accent)] underline decoration-[color:var(--accent)]/30 underline-offset-4" to="/topics">← Learn</Link>
        <div className="mt-4 section-eyebrow">Track</div>
        <h1 className="section-title mt-3 text-4xl">{topicId ? topicId.replace(/-/g, " ") : "C fundamentals"}</h1>
        <p className="section-copy mt-4">This is the path detail view, styled from the HTML mockup but simplified for the current pass.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow">Progress</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">18 / 42 solved</h2>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--surface-2)]"><div className="h-full w-[43%] rounded-full bg-[color:var(--accent-btn)]" /></div>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="stat-chip">Types</span>
            <span className="stat-chip">Control flow</span>
            <span className="stat-chip">I/O</span>
          </div>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <p className="section-eyebrow">Questions</p>
          <div className="mt-4 space-y-3">
            {[
              ["Sum of an int array", "Coding · easy"],
              ["What does %zu print?", "MCQ · easy"],
              ["Integer promotion rules", "MCQ · medium"],
              ["Complete the swap function", "Fill blank · medium"],
            ].map(([title, meta], index) => (
              <div key={title as string} className={`rounded-2xl border px-4 py-4 ${index === 2 ? "border-[color:var(--accent)] bg-[color:var(--surface-2)]" : "border-[color:var(--line)] bg-white"}`}>
                <h3 className="text-lg font-semibold tracking-tight">{title as string}</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{meta as string}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
