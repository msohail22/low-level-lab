import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { apiFetch } from "@/lib/api";

type QuestionRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  difficulty: string;
  reviewNote: string | null;
  createdAt: string;
};

export default function MyQuestions() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({
    queryKey: ["my-questions"],
    queryFn: async () => {
      const res = await apiFetch<{ questions: QuestionRow[] }>(
        "/api/questions/mine",
      );
      if (res.error) throw new Error(res.error);
      return res.data!.questions;
    },
  });

  const submit = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/questions/${id}/submit`, {
        method: "POST",
        body: "{}",
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-questions"] }),
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Contribute</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">My questions</h1>
          <p className="section-copy mt-2">
            Draft locally, submit for review, and track approvals.
          </p>
        </div>
        <Link className="auth-primary-btn shrink-0 text-center" to="/contribute/questions/new">
          New question
        </Link>
      </div>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">
          {(error as Error).message}
        </p>
      )}

      <ul className="mt-8 space-y-3">
        {data?.map((q) => (
          <li key={q.id} className="surface-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-[color:var(--ink)]">{q.title}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {q.type} · {q.difficulty} · {q.status}
                </p>
                {q.reviewNote && (
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    Review note: {q.reviewNote}
                  </p>
                )}
              </div>
              {(q.status === "draft" || q.status === "rejected") && (
                <button
                  type="button"
                  className="auth-secondary-btn"
                  disabled={submit.isPending}
                  onClick={() => submit.mutate(q.id)}
                >
                  Submit for review
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {data?.length === 0 && (
        <p className="mt-8 text-[color:var(--muted)]">
          No questions yet. Create your first one.
        </p>
      )}

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/dashboard">
        ← Back to dashboard
      </Link>
    </main>
  );
}
