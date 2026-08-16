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
  options: PracticeOption[];
};

type AttemptView = {
  isCorrect: boolean;
  explanation: string;
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

  const prior = data?.attempt;
  const question = data?.question;
  const shown = result ?? prior;

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
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["learn-topic-questions", question?.topicId],
      });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (err: Error) => setError(err.message),
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
          <h1 className="section-title mt-2">{question.title}</h1>
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
