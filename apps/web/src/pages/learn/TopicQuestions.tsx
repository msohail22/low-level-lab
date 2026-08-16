import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "@/lib/api";

type QuestionRow = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  attempted: boolean;
  isCorrect: boolean | null;
};

export default function TopicQuestions() {
  const { topicId = "" } = useParams();

  const { data, isPending, error } = useQuery({
    queryKey: ["learn-topic-questions", topicId],
    enabled: Boolean(topicId),
    queryFn: async () => {
      const res = await apiFetch<{ questions: QuestionRow[] }>(
        `/api/learn/topics/${topicId}/questions`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!.questions;
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Learn</p>
      <h1 className="section-title mt-2">Questions</h1>
      <p className="section-copy mt-2">
        One attempt per question. Correct answers count on the leaderboard.
      </p>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      <ul className="mt-8 space-y-3">
        {data?.map((q) => (
          <li key={q.id}>
            <Link
              to={`/practice/${q.id}`}
              className="surface-card block p-5 transition hover:border-[color:var(--accent)]"
            >
              <p className="font-semibold text-[color:var(--ink)]">{q.title}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {q.type} · {q.difficulty}
                {q.attempted
                  ? q.isCorrect
                    ? " · correct"
                    : " · attempted"
                  : " · not attempted"}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {data?.length === 0 && (
        <p className="mt-8 text-[color:var(--muted)]">
          No approved questions in this topic yet.
        </p>
      )}

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/topics">
        ← Back to topics
      </Link>
    </main>
  );
}
