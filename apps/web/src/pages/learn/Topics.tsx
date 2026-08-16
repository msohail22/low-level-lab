import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import type { TopicMastery } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function Topics() {
  const { data, isPending, error } = useQuery({
    queryKey: ["mastery"],
    queryFn: async () => {
      const res = await apiFetch<{ topics: TopicMastery[] }>("/api/learn/mastery");
      if (res.error) throw new Error(res.error);
      return res.data!.topics;
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Learn</p>
      <h1 className="section-title mt-2">Topics</h1>
      <p className="section-copy mt-2">
        Practice approved C++ and low-level questions by topic. Mastery is
        correct answers over approved count.
      </p>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      <ul className="mt-8 space-y-3">
        {data?.map((topic) => (
          <li key={topic.topicId}>
            <Link
              to={`/topics/${topic.topicId}`}
              className="surface-card block p-5 transition hover:border-[color:var(--accent)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-[color:var(--ink)]">
                  {topic.title}
                </p>
                <p className="text-sm text-[color:var(--accent)]">
                  {topic.masteryPercent}% mastery
                </p>
              </div>
              {topic.description && (
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {topic.description}
                </p>
              )}
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                {topic.correct}/{topic.approvedCount} correct · {topic.attempted}{" "}
                attempted · {topic.remaining} remaining
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/dashboard">
        ← Back to dashboard
      </Link>
    </main>
  );
}
