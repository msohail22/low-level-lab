import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FilterSelect } from "@/components/QuestionFilters";
import { Alert, Button, Card, LinkButton, Textarea } from "@/components/ui";
import {
  DIFFICULTY_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "@/lib/filter-options";
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
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const { data, isPending, error } = useQuery({
    queryKey: ["review-pending", type, difficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (difficulty) params.set("difficulty", difficulty);
      const qs = params.toString();
      const res = await apiFetch<{ questions: QuestionRow[] }>(
        `/api/review/pending${qs ? `?${qs}` : ""}`,
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
    <AppShell eyebrow="Review" title="Pending questions">
      <p className="section-copy mt-2">
        Approve solid questions or reject with a short note for the author.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <FilterSelect
          label="Type"
          value={type}
          onChange={setType}
          options={TYPE_FILTER_OPTIONS}
        />
        <FilterSelect
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={DIFFICULTY_FILTER_OPTIONS}
        />
      </div>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">
          {(error as Error).message}. Set your user id in{" "}
          <code>REVIEWER_USER_IDS</code> (local) or grant OpenFGA{" "}
          <code>reviewer</code>.
        </p>
      )}
      {actionError && (
        <Alert className="mt-4" variant="error">
          {actionError}
        </Alert>
      )}

      <ul className="mt-8 space-y-4">
        {data?.map((q) => (
          <li key={q.id}>
            <Card className="space-y-4 p-5">
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
                <Textarea
                  className="min-h-20"
                  value={note[q.id] ?? ""}
                  onChange={(e) =>
                    setNote((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: q.id, action: "approve" })}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: q.id, action: "reject" })}
                >
                  Reject
                </Button>
                <LinkButton
                  to={`/review/questions/${q.id}/diff`}
                  variant="secondary"
                  className="text-center shrink-0"
                >
                  Version Diff
                </LinkButton>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {data?.length === 0 && (
        <p className="mt-8 text-[color:var(--muted)]">Queue is empty for these filters.</p>
      )}

      <ModerationPanels />
    </AppShell>
  );
}

function ModerationPanels() {
  const queryClient = useQueryClient();

  const comments = useQuery({
    queryKey: ["mod-comments"],
    queryFn: async () => {
      const res = await apiFetch<{
        comments: {
          id: string;
          body: string;
          questionTitle: string;
          authorName: string;
        }[];
      }>("/api/learn/moderation/comments");
      if (res.error) throw new Error(res.error);
      return res.data!.comments;
    },
  });

  const reports = useQuery({
    queryKey: ["mod-reports"],
    queryFn: async () => {
      const res = await apiFetch<{
        reports: {
          id: string;
          reason: string;
          details: string | null;
          questionTitle: string;
          reporterName: string;
        }[];
      }>("/api/learn/moderation/reports");
      if (res.error) throw new Error(res.error);
      return res.data!.reports;
    },
  });

  const duplicates = useQuery({
    queryKey: ["mod-duplicates"],
    queryFn: async () => {
      const res = await apiFetch<{
        flags: {
          id: string;
          questionId: string;
          questionTitle: string;
          similarQuestionId: string | null;
          note: string | null;
        }[];
      }>("/api/learn/moderation/duplicates");
      if (res.error) throw new Error(res.error);
      return res.data!.flags;
    },
  });

  const commentAction = useMutation({
    mutationFn: async (opts: { id: string; action: "approve" | "reject" }) => {
      const res = await apiFetch(
        `/api/learn/moderation/comments/${opts.id}/${opts.action}`,
        { method: "POST" },
      );
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["mod-comments"] }),
  });

  const reportAction = useMutation({
    mutationFn: async (opts: {
      id: string;
      action: "resolve" | "dismiss";
    }) => {
      const res = await apiFetch(
        `/api/learn/moderation/reports/${opts.id}/${opts.action}`,
        { method: "POST" },
      );
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["mod-reports"] }),
  });

  const duplicateAction = useMutation({
    mutationFn: async (opts: {
      id: string;
      action: "resolve" | "dismiss";
    }) => {
      const res = await apiFetch(
        `/api/learn/moderation/duplicates/${opts.id}/${opts.action}`,
        { method: "POST" },
      );
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["mod-duplicates"] }),
  });

  return (
    <>
      <h2 className="mt-12 text-lg font-semibold">Pending comments</h2>
      <ul className="mt-4 space-y-3">
        {comments.data?.map((c) => (
          <li key={c.id}>
            <Card className="space-y-3 p-4">
              <p className="text-sm text-[color:var(--muted)]">
                {c.authorName} on {c.questionTitle}
              </p>
              <p className="text-sm">{c.body}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() =>
                    commentAction.mutate({ id: c.id, action: "approve" })
                  }
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    commentAction.mutate({ id: c.id, action: "reject" })
                  }
                >
                  Reject
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {comments.data?.length === 0 && (
        <p className="mt-2 text-sm text-[color:var(--muted)]">No pending comments.</p>
      )}

      <h2 className="mt-12 text-lg font-semibold">Open reports</h2>
      <ul className="mt-4 space-y-3">
        {reports.data?.map((r) => (
          <li key={r.id}>
            <Card className="space-y-3 p-4">
              <p className="font-medium">{r.questionTitle}</p>
              <p className="text-sm text-[color:var(--muted)]">
                {r.reason} — {r.reporterName}
              </p>
              {r.details && <p className="text-sm">{r.details}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() =>
                    reportAction.mutate({ id: r.id, action: "resolve" })
                  }
                >
                  Resolve
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    reportAction.mutate({ id: r.id, action: "dismiss" })
                  }
                >
                  Dismiss
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {reports.data?.length === 0 && (
        <p className="mt-2 text-sm text-[color:var(--muted)]">No open reports.</p>
      )}

      <h2 className="mt-12 text-lg font-semibold">Duplicate flags</h2>
      <ul className="mt-4 space-y-3">
        {duplicates.data?.map((f) => (
          <li key={f.id}>
            <Card className="space-y-3 p-4">
              <p className="font-medium">{f.questionTitle}</p>
              {f.note && <p className="text-sm text-[color:var(--muted)]">{f.note}</p>}
              {f.similarQuestionId && (
                <p className="text-sm text-[color:var(--muted)]">
                  Similar: {f.similarQuestionId}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() =>
                    duplicateAction.mutate({ id: f.id, action: "resolve" })
                  }
                >
                  Resolve
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    duplicateAction.mutate({ id: f.id, action: "dismiss" })
                  }
                >
                  Dismiss
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {duplicates.data?.length === 0 && (
        <p className="mt-2 text-sm text-[color:var(--muted)]">No duplicate flags.</p>
      )}
    </>
  );
}
