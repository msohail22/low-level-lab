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
};

export default function PracticeQuestionPage() {
  const { questionId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [booleanValue, setBooleanValue] = useState<boolean | null>(null);
  const [result, setResult] = useState<AttemptView | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ["practice-question", questionId] });
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
            <button
              type="button"
              className="auth-secondary-btn shrink-0"
              onClick={() => toggleBookmark.mutate()}
              disabled={toggleBookmark.isPending}
            >
              {bookmarkStatus.data?.bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {question.type} · {question.difficulty}
          </p>
          <p className="section-copy mt-4 whitespace-pre-wrap">{question.prompt}</p>
          {question.codeSnippet && (
            <pre className="surface-card mt-4 overflow-x-auto p-4 font-mono text-sm">
              {question.codeSnippet}
            </pre>
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
