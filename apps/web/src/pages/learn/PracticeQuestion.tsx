import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type {
  AttemptResult,
  ExplanationVoteStats,
  PracticeQuestion,
  PrerequisiteGate,
} from "@llb/shared";

import { Alert, Button, Card, Input, Textarea } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { flushUiEvents, trackUiEvent } from "@/lib/ui-analytics";

export default function PracticeQuestionPage() {
  const { questionId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get("playlist");
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [booleanValue, setBooleanValue] = useState<boolean | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState<string[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [sandboxMsg, setSandboxMsg] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [timedMode, setTimedMode] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const viewStarted = useRef(0);
  const submittedRef = useRef(false);
  const hoverAccum = useRef<Record<string, number>>({});
  const hoverStart = useRef<Record<string, number>>({});

  useEffect(() => {
    viewStarted.current = Date.now();
    submittedRef.current = false;
    hoverAccum.current = {};
    hoverStart.current = {};
    const hoverSnapshot = hoverAccum;
    return () => {
      const durationMs = Date.now() - viewStarted.current;
      trackUiEvent({
        eventName: submittedRef.current ? "question_view" : "abandon",
        questionId,
        durationMs,
      });
      for (const [targetId, ms] of Object.entries(hoverSnapshot.current)) {
        if (ms > 0) {
          trackUiEvent({
            eventName: "option_hover",
            questionId,
            targetId,
            durationMs: Math.round(ms),
          });
        }
      }
      void flushUiEvents();
    };
  }, [questionId]);

  useEffect(() => {
    if (!timedMode || result) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - viewStarted.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [timedMode, result, questionId]);

  const { data, isPending } = useQuery({
    queryKey: ["practice-question", questionId],
    enabled: Boolean(questionId),
    queryFn: async () => {
      const res = await apiFetch<{
        question: PracticeQuestion;
        attempt: AttemptResult | null;
        votes: ExplanationVoteStats;
        prerequisite: PrerequisiteGate;
      }>(`/api/learn/questions/${questionId}`);
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const playlist = useQuery({
    queryKey: ["playlist-play", playlistId],
    enabled: Boolean(playlistId),
    queryFn: async () => {
      const res = await apiFetch<{
        play: {
          nextQuestionId: string | null;
          items: { questionId: string }[];
        };
      }>(`/api/learn/sets/${playlistId}/play`);
      if (res.error) throw new Error(res.error);
      return res.data!.play;
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
      const res = await apiFetch<{
        comments: { id: string; body: string; authorName: string }[];
      }>(`/api/learn/questions/${questionId}/comments`);
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
      trackUiEvent({ eventName: "submit_click", questionId });
      const body =
        question?.type === "true_false"
          ? {
              booleanValue: booleanValue === true,
              confidence: confidence ?? undefined,
              timedMode,
              elapsedMs: timedMode ? elapsedMs : undefined,
            }
          : {
              optionIds: selected,
              confidence: confidence ?? undefined,
              timedMode,
              elapsedMs: timedMode ? elapsedMs : undefined,
            };

      const res = await apiFetch<AttemptResult>(
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
      submittedRef.current = true;
      setError(null);
      queryClient.invalidateQueries({
        queryKey: ["learn-topic-questions", question?.topicId],
      });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["learning-stats"] });
      queryClient.invalidateQueries({ queryKey: ["continue"] });
      queryClient.invalidateQueries({ queryKey: ["mastery"] });
      queryClient.invalidateQueries({ queryKey: ["practice-question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["next-question", questionId] });
      if (playlistId) {
        queryClient.invalidateQueries({ queryKey: ["playlist-play", playlistId] });
      }
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      trackUiEvent({ eventName: "bookmark_toggle", questionId });
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
      trackUiEvent({
        eventName: "hint_reveal",
        questionId,
        meta: { index },
      });
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

  const vote = useMutation({
    mutationFn: async (helpful: boolean) => {
      const res = await apiFetch(
        `/api/learn/questions/${questionId}/explanation-vote`,
        {
          method: "POST",
          body: JSON.stringify({ helpful }),
        },
      );
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["practice-question", questionId],
      }),
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

  const flagDup = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/api/learn/questions/${questionId}/duplicate-flag`,
        {
          method: "POST",
          body: JSON.stringify({
            similarQuestionId: question?.similarQuestionId || undefined,
            note: "Possible duplicate",
          }),
        },
      );
      if (res.error) throw new Error(res.error);
    },
  });

  const sandbox = useMutation({
    mutationFn: async () => {
      trackUiEvent({ eventName: "sandbox_check", questionId });
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
    onSuccess: (payload) => setSandboxMsg(payload.feedback),
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

  const playlistNext =
    playlist.data?.items.find((i) => i.questionId === questionId) &&
    playlist.data.items[
      playlist.data.items.findIndex((i) => i.questionId === questionId) + 1
    ]?.questionId;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Practice</p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}

      {data?.prerequisite?.warn && data.prerequisite.prerequisite && (
        <Card className="mt-4 p-4 text-sm text-[color:var(--muted)]">
          Soft prerequisite:{" "}
          <Link
            className="text-[color:var(--accent)]"
            to={`/topics/${data.prerequisite.prerequisite.id}`}
          >
            {data.prerequisite.prerequisite.title}
          </Link>{" "}
          (your mastery there is {data.prerequisite.masteryPercent ?? 0}%).
        </Card>
      )}

      {question && (
        <>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="section-title">{question.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => {
                  setTimedMode((v) => !v);
                  viewStarted.current = Date.now();
                  setElapsedMs(0);
                }}
              >
                {timedMode
                  ? `Timer ${(elapsedMs / 1000).toFixed(0)}s`
                  : "Timed mode"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => toggleBookmark.mutate()}
                disabled={toggleBookmark.isPending}
              >
                {bookmarkStatus.data?.bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => toggleFollow.mutate()}
                disabled={toggleFollow.isPending}
              >
                {followStatus.data?.following ? "Following" : "Follow author"}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {question.type} · {question.difficulty}
            {question.calibration?.percentCorrect != null && (
              <>
                {" "}
                · Community {question.calibration.percentCorrect}% correct (
                {question.calibration.attempts})
              </>
            )}
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
            <Card className="mt-4 overflow-x-auto p-4 font-mono text-sm">
              <pre>{question.codeSnippet}</pre>
            </Card>
          )}
          {question.diagramMarkdown && (
            <Card className="mt-4 overflow-x-auto p-4 text-sm">
              <pre>{question.diagramMarkdown}</pre>
            </Card>
          )}

          {question.hintCount > 0 && !shown && (
            <div className="mt-6 space-y-2">
              {hintsRevealed.map((body, i) => (
                <Card key={i} className="p-3 text-sm text-[color:var(--muted)]">
                  Hint {i + 1}: {body}
                </Card>
              ))}
              {hintsRevealed.length < question.hintCount && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => revealHint.mutate()}
                  disabled={revealHint.isPending}
                >
                  Reveal hint ({hintsRevealed.length}/{question.hintCount})
                </Button>
              )}
            </div>
          )}

          {question.type === "true_false" ? (
            <div className="mt-6 flex gap-4">
              {[true, false].map((value) => (
                <Button
                  key={String(value)}
                  type="button"
                  variant="secondary"
                  disabled={Boolean(shown)}
                  className={
                    (shown ? shown.booleanValue : booleanValue) === value
                      ? "border-[color:var(--accent)]"
                      : ""
                  }
                  onClick={() => setBooleanValue(value)}
                >
                  {value ? "True" : "False"}
                </Button>
              ))}
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {question.options.map((opt) => {
                const state = optionState.get(opt.id) ?? "idle";
                const checked = selected.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      disabled={Boolean(shown)}
                      onClick={() => toggleOption(opt.id)}
                      onMouseEnter={() => {
                        hoverStart.current[opt.id] = Date.now();
                      }}
                      onMouseLeave={() => {
                        const start = hoverStart.current[opt.id];
                        if (!start) return;
                        hoverAccum.current[opt.id] =
                          (hoverAccum.current[opt.id] ?? 0) +
                          (Date.now() - start);
                        delete hoverStart.current[opt.id];
                      }}
                      className={`h-auto justify-start gap-3 rounded-[var(--radius-card)] p-4 text-left ${
                        checked || state !== "idle"
                          ? "border-[color:var(--accent)]"
                          : ""
                      }`}
                    >
                      <span className="font-semibold">{opt.label}.</span>
                      <span>{opt.body}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          {!shown && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-[color:var(--muted)]">
                Confidence (feeds spaced review)
              </p>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant="secondary"
                    className={
                      confidence === n ? "border-[color:var(--accent)]" : ""
                    }
                    onClick={() => setConfidence(n)}
                  >
                    {n === 1 ? "Guessing" : n === 2 ? "Okay" : "Sure"}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={
                  submit.isPending ||
                  (question.type === "true_false"
                    ? booleanValue === null
                    : selected.length === 0)
                }
                onClick={() => submit.mutate()}
              >
                {submit.isPending ? "Checking…" : "Submit answer"}
              </Button>
            </div>
          )}

          {error && (
            <Alert className="mt-4" variant="error">
              {error}
            </Alert>
          )}

          {shown && (
            <Card className="mt-8 space-y-3 p-5">
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
              {shown.isCorrect && shown.workedSolution && (
                <p className="whitespace-pre-wrap text-sm text-[color:var(--ink)]">
                  Worked solution: {shown.workedSolution}
                </p>
              )}
              {!shown.isCorrect && shown.whyWrong && (
                <p className="whitespace-pre-wrap text-sm text-[color:var(--ink)]">
                  Why this is wrong: {shown.whyWrong}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-[color:var(--muted)]">
                  Explanation helpful?
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => vote.mutate(true)}
                >
                  Yes ({data.votes.helpful})
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => vote.mutate(false)}
                >
                  No ({data.votes.unhelpful})
                </Button>
              </div>
              {(shown.relatedQuestionId || question.relatedQuestionId) && (
                <Link
                  className="inline-block text-sm text-[color:var(--accent)]"
                  to={`/practice/${shown.relatedQuestionId || question.relatedQuestionId}`}
                >
                  Related follow-up →
                </Link>
              )}
              {playlistNext ? (
                <Link
                  className="block text-sm text-[color:var(--accent)]"
                  to={`/practice/${playlistNext}?playlist=${playlistId}`}
                >
                  Next in playlist →
                </Link>
              ) : nextQuestion.data ? (
                <Link
                  className="block text-sm text-[color:var(--accent)]"
                  to={`/practice/${nextQuestion.data.id}`}
                >
                  Suggested next: {nextQuestion.data.title} →
                </Link>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  trackUiEvent({ eventName: "retry_click", questionId });
                  setRetrying(true);
                  setResult(null);
                  setSelected([]);
                  setBooleanValue(null);
                  setConfidence(null);
                  viewStarted.current = Date.now();
                  setElapsedMs(0);
                }}
              >
                Try again
              </Button>
            </Card>
          )}

          {(question.type === "print_output" || question.codeSnippet) && (
            <Card className="mt-8 space-y-3 p-5">
              <p className="font-semibold">Sandbox</p>
              <Textarea
                className="min-h-24 font-mono text-sm"
                placeholder="Predicted output"
                value={sandboxOutput}
                onChange={(e) => setSandboxOutput(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => sandbox.mutate()}
                disabled={sandbox.isPending}
              >
                Check output
              </Button>
              {sandboxMsg && (
                <p className="text-sm text-[color:var(--ink)]">{sandboxMsg}</p>
              )}
            </Card>
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
              <Textarea
                className="min-h-20"
                placeholder="Comment (moderated before publish)"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                required
                minLength={2}
              />
              <Button type="submit" variant="secondary">
                Submit for moderation
              </Button>
            </form>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Card className="flex-1 p-5">
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  report.mutate();
                }}
              >
                <p className="font-semibold">Report question</p>
                <Input
                  placeholder="Reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  minLength={3}
                />
                <Textarea
                  className="min-h-16"
                  placeholder="Details (optional)"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />
                <Button type="submit" variant="secondary">
                  Send report
                </Button>
              </form>
            </Card>
            <Card className="flex-1 space-y-2 p-5">
              <p className="font-semibold">Duplicate?</p>
              <p className="text-sm text-[color:var(--muted)]">
                Flag for reviewers if this looks like another question.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => flagDup.mutate()}
                disabled={flagDup.isPending}
              >
                Flag as duplicate
              </Button>
            </Card>
          </div>

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
