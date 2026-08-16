import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { apiFetch } from "@/lib/api";

type QuestionRow = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  prompt: string;
  createdAt: string;
};

export default function ReviewQueue() {
  const queryClient = useQueryClient();
  const [note, setNote] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["review-pending"],
    queryFn: async () => {
      const res = await apiFetch<{ questions: QuestionRow[] }>(
        "/api/review/pending",
      );
      if (res.error) throw new Error(res.error);
      return res.data!.questions;
    },
  });

  const review = useMutation({
    mutationFn: async (opts: {
      id: string;
      action: "approve" | "reject";
    }) => {
      const res = await apiFetch(`/api/review/${opts.id}/${opts.action}`, {
        method: "POST",
        body: JSON.stringify({ note: note[opts.id] || undefined }),
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["review-pending"] });
    },
    onError: (err: Error) => setActionError(err.message),
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Review</p>
      <h1 className="section-title mt-2">Pending questions</h1>
      <p className="section-copy mt-2">
        Approve solid questions or reject with a short note for the author.
      </p>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">
          {(error as Error).message}. Set your user id in{" "}
          <code>REVIEWER_USER_IDS</code> (local) or grant OpenFGA{" "}
          <code>reviewer</code>.
        </p>
      )}
      {actionError && <p className="mt-4 text-sm text-red-700">{actionError}</p>}

      <ul className="mt-8 space-y-4">
        {data?.map((q) => (
          <li key={q.id} className="surface-card space-y-4 p-5">
            <div>
              <p className="font-semibold text-[color:var(--ink)]">{q.title}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                {q.type} · {q.difficulty}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[color:var(--ink)]">
                {q.prompt}
              </p>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Note (optional)</span>
              <textarea
                className="auth-input min-h-20"
                value={note[q.id] ?? ""}
                onChange={(e) =>
                  setNote((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="auth-primary-btn"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: q.id, action: "approve" })}
              >
                Approve
              </button>
              <button
                type="button"
                className="auth-secondary-btn"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: q.id, action: "reject" })}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>

      {data?.length === 0 && (
        <p className="mt-8 text-[color:var(--muted)]">Queue is empty.</p>
      )}

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/dashboard">
        ← Back to dashboard
      </Link>
    </main>
  );
}
