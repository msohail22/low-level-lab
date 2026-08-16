import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

type PathDetail = {
  id: string;
  title: string;
  description: string | null;
  progressPercent: number;
  topics: {
    topicId: string;
    title: string;
    description: string | null;
    approvedCount: number;
    correctCount: number;
    progressPercent: number;
  }[];
};

export default function PathDetailPage() {
  const { pathId = "" } = useParams();
  const { data, isPending, error } = useQuery({
    queryKey: ["learning-path", pathId],
    enabled: Boolean(pathId),
    queryFn: async () => {
      const res = await apiFetch<{ path: PathDetail }>(
        `/api/learn/paths/${pathId}`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!.path;
    },
  });

  return (
    <AppShell eyebrow="Learn" title={data?.title ?? "Path"}>
      {data?.description && (
        <p className="section-copy mt-2">{data.description}</p>
      )}
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}
      {data && (
        <>
          <p className="mt-4 text-sm text-[color:var(--accent)]">
            Overall {data.progressPercent}% complete
          </p>
          <ol className="mt-8 space-y-3">
            {data.topics.map((topic, index) => (
              <li key={topic.topicId}>
                <Link
                  to={`/topics/${topic.topicId}`}
                  className="surface-card block p-5 transition hover:border-[color:var(--accent)]"
                >
                  <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 font-semibold text-[color:var(--ink)]">
                    {topic.title}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {topic.correctCount}/{topic.approvedCount} correct ·{" "}
                    {topic.progressPercent}%
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/paths">
        ← All paths
      </Link>
    </AppShell>
  );
}
