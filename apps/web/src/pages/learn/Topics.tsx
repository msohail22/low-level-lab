import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { apiFetch } from "@/lib/api";

type Topic = {
  id: string;
  title: string;
  description: string | null;
  approvedCount: number;
};

export default function Topics() {
  const { data, isPending, error } = useQuery({
    queryKey: ["learn-topics"],
    queryFn: async () => {
      const res = await apiFetch<{ topics: Topic[] }>("/api/learn/topics");
      if (res.error) throw new Error(res.error);
      return res.data!.topics;
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Learn</p>
      <h1 className="section-title mt-2">Topics</h1>
      <p className="section-copy mt-2">
        Practice approved C++ and low-level questions by topic.
      </p>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      <ul className="mt-8 space-y-3">
        {data?.map((topic) => (
          <li key={topic.id}>
            <Link
              to={`/topics/${topic.id}`}
              className="surface-card block p-5 transition hover:border-[color:var(--accent)]"
            >
              <p className="font-semibold text-[color:var(--ink)]">{topic.title}</p>
              {topic.description && (
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {topic.description}
                </p>
              )}
              <p className="mt-3 text-sm text-[color:var(--accent)]">
                {topic.approvedCount} approved question
                {topic.approvedCount === 1 ? "" : "s"}
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
