import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { apiFetch } from "@/lib/api";

type PracticeOption = {
  id: string;
  label: string;
  body: string;
};

type PracticeQuestion = {
  id: string;
  topicId: string;
  type: string;
  title: string;
  prompt: string;
  difficulty: string;
  codeSnippet: string | null;
  relatedQuestionId: string | null;
  hintCount: number;
  authorId: string;
  authorName: string | null;
  options: PracticeOption[];
};

type AttemptView = {
  isCorrect: boolean;
  explanation: string;
  whyWrong?: string | null;
  relatedQuestionId?: string | null;
  correctBooleanValue: boolean | null;
  correctOptionIds: string[];
  selectedOptionIds?: string[];
  booleanValue?: boolean | null;
  dailyChallengeCorrect?: boolean;
};

type Comment = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export default function PracticeQuestionPage() {
  const { questionId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [booleanValue, setBooleanValue] = useState<boolean | null>(null);
  const [result, setResult] = useState<AttemptView | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState<string[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [sandboxMsg, setSandboxMsg] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["practice-question", questionId],
    enabled: Boolean(questionId),
    queryFn: async () => {
      const res = await apiFetch<{
        question: PracticeQuestion;
        attempt: AttemptView | null;
      }>(`/api/learn/questions/${questionId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const bookmarkStatus = useQuery({
    queryKey: ["bookmark-status", questionId],
    enabled: Boolean(questionId),
    queryFn: async () => {
      const res = await apiFetch<{ bookmarked: boolean }>(
        `/api/learn/bookmarks/${questionId}/status`,
      );
      if (res.status === 401) return { bookmarked: false };
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const comments = useQuery({
    queryKey: ["question-comments", questionId],
    enabled: Boolean(questionId),
    queryFn: async () => {
      const res = await apiFetch<{ comments: Comment[] }>(
        `/api/learn/questions/${questionId}/comments`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!.comments;
    },
  });

  const nextQuestion = useQuery({
    queryKey: ["next-question", questionId],
    enabled: Boolean(questionId),
    queryFn: async () => {
      const res = await apiFetch<{
        next: { id: string; title: string; reason: string } | null;
      }>(`/api/learn/questions/${questionId}/next`);
      if (res.error) throw new Error(res.error);
      return res.data!.next;
    },
  });

  const followStatus = useQuery({
    queryKey: ["follow-status", data?.question.authorId],
    enabled: Boolean(data?.question.authorId),
    queryFn: async () => {
      const res = await apiFetch<{ following: boolean }>(
        `/api/learn/authors/${data!.question.authorId}/follow/status`,
      );
      if (res.status === 401) return { following: false };
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const prior = data?.attempt;
  const question = data?.question;
  const shown = retrying ? null : (result ?? prior);

  const submit = useMutation({
    mutationFn: async () => {
      const body =
        question?.type === "true_false"
          ? { booleanValue: booleanValue === true }
          : { optionIds: selected };

      const res = await apiFetch<AttemptView>(
        `/api/learn/questions/${questionId}/attempt`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (payload) => {
      setResult(payload);
      setRetrying(false);
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["learn-topic-questions", question?.topicId],
      });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["learning-stats"] });
      queryClient.invalidateQueries({ queryKey: ["due-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["mistakes"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({ queryKey: ["daily-challenge"] });
      queryClient.invalidateQueries({ queryKey: ["practice-question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["next-question", questionId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (bookmarkStatus.data?.bookmarked) {
        const res = await apiFetch(`/api/learn/bookmarks/${questionId}`, {
          method: "DELETE",
        });
        if (res.error) throw new Error(res.error);
        return false;
      }
      const res = await apiFetch("/api/learn/bookmarks", {
        method: "POST",
        body: JSON.stringify({ questionId }),
      });
      if (res.error) throw new Error(res.error);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark-status", questionId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const revealHint = useMutation({
    mutationFn: async () => {
      const index = hintsRevealed.length;
      const res = await apiFetch<{
        hint: { index: number; body: string; remaining: number };
      }>(`/api/learn/questions/${questionId}/hints/${index}`);
      if (res.error) throw new Error(res.error);
      return res.data!.hint;
    },
    onSuccess: (hint) => {
      setHintsRevealed((prev) => [...prev, hint.body]);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const postComment = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/learn/questions/${questionId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentBody }),
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      setCommentBody("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const report = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/learn/questions/${questionId}/report`, {
        method: "POST",
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails || undefined,
        }),
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      setReportReason("");
      setReportDetails("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const sandbox = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{
        mode: string;
        isCorrect: boolean | null;
        feedback: string;
      }>(`/api/learn/questions/${questionId}/sandbox`, {
        method: "POST",
        body: JSON.stringify({
          sourceCode: question?.codeSnippet ?? undefined,
          submittedOutput: sandboxOutput,
        }),
      });
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (payload) => {
      setSandboxMsg(payload.feedback);
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      const authorId = question!.authorId;
      if (followStatus.data?.following) {
        const res = await apiFetch(`/api/learn/authors/${authorId}/follow`, {
          method: "DELETE",
        });
        if (res.error) throw new Error(res.error);
        return false;
      }
      const res = await apiFetch(`/api/learn/authors/${authorId}/follow`, {
        method: "POST",
      });
      if (res.error) throw new Error(res.error);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["follow-status", question?.authorId],
      });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
    },
  });

  const isMulti = question?.type === "multi_select";

  const optionState = useMemo(() => {
    if (!shown) return new Map<string, "idle" | "picked" | "correct" | "missed">();
    const map = new Map<string, "idle" | "picked" | "correct" | "missed">();
    const correct = new Set(shown.correctOptionIds);
    const picked = new Set(shown.selectedOptionIds ?? selected);
    for (const opt of question?.options ?? []) {
      if (correct.has(opt.id) && picked.has(opt.id)) map.set(opt.id, "correct");
      else if (correct.has(opt.id)) map.set(opt.id, "missed");
      else if (picked.has(opt.id)) map.set(opt.id, "picked");
      else map.set(opt.id, "idle");
    }
    return map;
  }, [shown, question, selected]);

  function toggleOption(id: string) {
    if (shown) return;
    if (isMulti) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
      return;
    }
    setSelected([id]);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Practice</p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}

      {question && (
        <>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="section-title">{question.title}</h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="auth-secondary-btn shrink-0"
                onClick={() => toggleBookmark.mutate()}
                disabled={toggleBookmark.isPending}
              >
                {bookmarkStatus.data?.bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
              <button
                type="button"
                className="auth-secondary-btn shrink-0"
                onClick={() => toggleFollow.mutate()}
                disabled={toggleFollow.isPending}
              >
                {followStatus.data?.following ? "Following" : "Follow author"}
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {question.type} · {question.difficulty}
            {question.authorName && (
              <>
                {" "}
                ·{" "}
                <Link
                  className="text-[color:var(--accent)]"
                  to={`/authors/${question.authorId}`}
                >
                  {question.authorName}
                </Link>
              </>
            )}
          </p>
          <p className="section-copy mt-4 whitespace-pre-wrap">{question.prompt}</p>
          {question.codeSnippet && (
            <pre className="surface-card mt-4 overflow-x-auto p-4 font-mono text-sm">
              {question.codeSnippet}
            </pre>
          )}

          {question.hintCount > 0 && !shown && (
            <div className="mt-6 space-y-2">
              {hintsRevealed.map((body, i) => (
                <p key={i} className="surface-card p-3 text-sm text-[color:var(--muted)]">
                  Hint {i + 1}: {body}
                </p>
              ))}
              {hintsRevealed.length < question.hintCount && (
                <button
                  type="button"
                  className="auth-secondary-btn"
                  onClick={() => revealHint.mutate()}
                  disabled={revealHint.isPending}
                >
                  Reveal hint ({hintsRevealed.length}/{question.hintCount})
                </button>
              )}
            </div>
          )}

          {question.type === "true_false" ? (
            <div className="mt-6 flex gap-4">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  disabled={Boolean(shown)}
                  className={`auth-secondary-btn ${
                    (shown ? shown.booleanValue : booleanValue) === value
                      ? "border-[color:var(--accent)]"
                      : ""
                  }`}
                  onClick={() => setBooleanValue(value)}
                >
                  {value ? "True" : "False"}
                </button>
              ))}
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {question.options.map((opt) => {
                const state = optionState.get(opt.id) ?? "idle";
                const checked = selected.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      disabled={Boolean(shown)}
                      onClick={() => toggleOption(opt.id)}
                      className={`surface-card flex w-full items-start gap-3 p-4 text-left ${
                        checked || state !== "idle"
                          ? "border-[color:var(--accent)]"
                          : ""
                      }`}
                    >
                      <span className="font-semibold">{opt.label}.</span>
                      <span>{opt.body}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!shown && (
            <button
              type="button"
              className="auth-primary-btn mt-8"
              disabled={
                submit.isPending ||
                (question.type === "true_false"
                  ? booleanValue === null
                  : selected.length === 0)
              }
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? "Checking…" : "Submit answer"}
            </button>
          )}

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          {shown && (
            <div className="surface-card mt-8 space-y-3 p-5">
              <p className="font-semibold text-[color:var(--ink)]">
                {shown.isCorrect ? "Correct" : "Not quite"}
              </p>
              {shown.dailyChallengeCorrect && (
                <p className="text-sm text-[color:var(--accent)]">
                  Daily challenge completed.
                </p>
              )}
              <p className="whitespace-pre-wrap text-sm text-[color:var(--muted)]">
                {shown.explanation}
              </p>
              {!shown.isCorrect && shown.whyWrong && (
                <p className="whitespace-pre-wrap text-sm text-[color:var(--ink)]">
                  Why this is wrong: {shown.whyWrong}
                </p>
              )}
              {(shown.relatedQuestionId || question.relatedQuestionId) && (
                <Link
                  className="inline-block text-sm text-[color:var(--accent)]"
                  to={`/practice/${shown.relatedQuestionId || question.relatedQuestionId}`}
                >
                  Related follow-up →
                </Link>
              )}
              {nextQuestion.data && (
                <Link
                  className="block text-sm text-[color:var(--accent)]"
                  to={`/practice/${nextQuestion.data.id}`}
                >
                  Suggested next: {nextQuestion.data.title} →
                </Link>
              )}
              <button
                type="button"
                className="auth-secondary-btn"
                onClick={() => {
                  setRetrying(true);
                  setResult(null);
                  setSelected([]);
                  setBooleanValue(null);
                }}
              >
                Try again
              </button>
            </div>
          )}

          {(question.type === "print_output" || question.codeSnippet) && (
            <div className="surface-card mt-8 space-y-3 p-5">
              <p className="font-semibold">Sandbox</p>
              <p className="text-sm text-[color:var(--muted)]">
                {question.type === "print_output"
                  ? "Predict stdout and check it against the expected output."
                  : "Full compile/run is not configured on Workers; submissions are recorded as stubs."}
              </p>
              <textarea
                className="auth-input min-h-24 font-mono text-sm"
                placeholder="Predicted output"
                value={sandboxOutput}
                onChange={(e) => setSandboxOutput(e.target.value)}
              />
              <button
                type="button"
                className="auth-secondary-btn"
                onClick={() => sandbox.mutate()}
                disabled={sandbox.isPending}
              >
                {sandbox.isPending ? "Checking…" : "Check output"}
              </button>
              {sandboxMsg && (
                <p className="text-sm text-[color:var(--ink)]">{sandboxMsg}</p>
              )}
            </div>
          )}

          <div className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold">Discussion</h2>
            <ul className="space-y-3">
              {comments.data?.map((c) => (
                <li key={c.id} className="border-b border-[color:var(--line)] py-3 text-sm">
                  <p className="font-medium">{c.authorName}</p>
                  <p className="mt-1 text-[color:var(--muted)]">{c.body}</p>
                </li>
              ))}
            </ul>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                postComment.mutate();
              }}
            >
              <textarea
                className="auth-input min-h-20"
                placeholder="Comment (moderated before publish)"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                required
                minLength={2}
              />
              <button
                type="submit"
                className="auth-secondary-btn"
                disabled={postComment.isPending || commentBody.trim().length < 2}
              >
                Submit for moderation
              </button>
            </form>
          </div>

          <form
            className="surface-card mt-10 space-y-2 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              report.mutate();
            }}
          >
            <p className="font-semibold">Report question</p>
            <input
              className="auth-input"
              placeholder="Reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              required
              minLength={3}
            />
            <textarea
              className="auth-input min-h-16"
              placeholder="Details (optional)"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
            <button
              type="submit"
              className="auth-secondary-btn"
              disabled={report.isPending || reportReason.trim().length < 3}
            >
              Send report
            </button>
          </form>

          <Link
            className="mt-8 inline-block text-sm text-[color:var(--accent)]"
            to={`/topics/${question.topicId}`}
          >
            ← Back to topic
          </Link>
        </>
      )}
    </main>
  );
}
