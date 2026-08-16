import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { FilterSelect } from "@/components/QuestionFilters";
import { Card } from "@/components/ui";
import {
  ATTEMPTED_FILTER_OPTIONS,
  DIFFICULTY_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "@/lib/filter-options";
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
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [attempted, setAttempted] = useState("all");

  const { data, isPending, error } = useQuery({
    queryKey: ["learn-topic-questions", topicId, type, difficulty, attempted],
    enabled: Boolean(topicId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (difficulty) params.set("difficulty", difficulty);
      if (attempted !== "all") params.set("attempted", attempted);
      const qs = params.toString();
      const res = await apiFetch<{ questions: QuestionRow[] }>(
        `/api/learn/topics/${topicId}/questions${qs ? `?${qs}` : ""}`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!.questions;
    },
  });

  return (
    <AppShell eyebrow="Learn" title="Questions">
      <p className="section-copy mt-2">
        One attempt per question. Correct answers count on the leaderboard.
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
        <FilterSelect
          label="Attempted"
          value={attempted}
          onChange={setAttempted}
          options={ATTEMPTED_FILTER_OPTIONS}
        />
      </div>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      <ul className="mt-8 space-y-3">
        {data?.map((q) => (
          <li key={q.id}>
            <Link to={`/practice/${q.id}`} className="block">
              <Card className="p-5 transition hover:border-[color:var(--accent)]">
                <p className="font-semibold text-[color:var(--ink)]">{q.title}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {q.type} · {q.difficulty}
                  {q.attempted
                    ? q.isCorrect
                      ? " · correct"
                      : " · attempted"
                    : " · not attempted"}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {data?.length === 0 && (
        <p className="mt-8 text-[color:var(--muted)]">
          No questions match these filters.
        </p>
      )}

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/topics">
        ← Back to topics
      </Link>
    </AppShell>
  );
}
