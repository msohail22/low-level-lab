"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DifficultyBadge } from "./DifficultyBadge";
import { KindBadge } from "./KindBadge";
import { DIFFICULTIES, type Difficulty } from "@/lib/topics";
import { KIND_LABELS, KINDS, type Kind } from "@/lib/kinds";

/**
 * The minimum a row needs. Deliberately not the whole Question: that carries
 * `choices`, and passing it would ship every answer in the topic to the list
 * page.
 */
export type Row = {
  slug: string;
  title: string;
  kind: Kind;
  difficulty: Difficulty;
};

type KindFilter = Kind | "all";
type DifficultyFilter = Difficulty | "all";

/**
 * Rows rendered before "Load more" appears.
 *
 * Same idea as the test cases, but not the same mechanism: the question index
 * is already in the bundle, so there is nothing to fetch. This caps what is
 * rendered, not what is loaded. Larger than the 25 used for test cases because
 * a row is one line, not a pair of input/output panes.
 */
const PAGE_SIZE = 50;

export function QuestionList({
  topicSlug,
  rows,
}: {
  topicSlug: string;
  rows: Row[];
}) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);

  // Changing a filter produces a different list, so paging starts over.
  function pickKind(next: KindFilter) {
    setKind(next);
    setShown(PAGE_SIZE);
  }

  function pickDifficulty(next: DifficultyFilter) {
    setDifficulty(next);
    setShown(PAGE_SIZE);
  }

  const visible = useMemo(
    () =>
      rows.filter(
        (r) =>
          (kind === "all" || r.kind === kind) &&
          (difficulty === "all" || r.difficulty === difficulty),
      ),
    [rows, kind, difficulty],
  );

  // Each group counts against the *other* filter, so the numbers always say
  // what you would actually get by clicking.
  const byDifficulty = rows.filter((r) => kind === "all" || r.kind === kind);
  const byKind = rows.filter(
    (r) => difficulty === "all" || r.difficulty === difficulty,
  );

  const kindsPresent = KINDS.filter((k) => rows.some((r) => r.kind === k));

  const page = visible.slice(0, shown);
  const hasMore = visible.length > page.length;

  return (
    <div>
      <div className="mt-5 space-y-2">
        <Group label="Type">
          <Chip
            active={kind === "all"}
            count={byKind.length}
            onClick={() => pickKind("all")}
          >
            All
          </Chip>
          {kindsPresent.map((k) => (
            <Chip
              key={k}
              active={kind === k}
              count={byKind.filter((r) => r.kind === k).length}
              onClick={() => pickKind(kind === k ? "all" : k)}
            >
              {KIND_LABELS[k]}
            </Chip>
          ))}
        </Group>

        <Group label="Difficulty">
          <Chip
            active={difficulty === "all"}
            count={byDifficulty.length}
            onClick={() => pickDifficulty("all")}
          >
            All
          </Chip>
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              active={difficulty === d}
              count={byDifficulty.filter((r) => r.difficulty === d).length}
              onClick={() => pickDifficulty(difficulty === d ? "all" : d)}
              tone={d}
            >
              {d}
            </Chip>
          ))}
        </Group>
      </div>

      <ul className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        {page.map((q, i) => (
          <li key={q.slug} className="border-b border-border last:border-0">
            <Link
              href={`/topics/${topicSlug}/${q.slug}`}
              className="flex items-baseline gap-3 px-4 py-3 hover:bg-bg"
            >
              <span className="w-5 shrink-0 text-sm text-muted">{i + 1}</span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{q.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 sm:hidden">
                  <DifficultyBadge difficulty={q.difficulty} />
                  <KindBadge kind={q.kind} />
                </span>
              </span>

              <span className="hidden shrink-0 items-center gap-3 sm:flex">
                <KindBadge kind={q.kind} />
                <span className="w-16 text-right">
                  <DifficultyBadge difficulty={q.difficulty} />
                </span>
              </span>
            </Link>
          </li>
        ))}

        {visible.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">
            Nothing matches.{" "}
            <button
              type="button"
              onClick={() => {
                setKind("all");
                setDifficulty("all");
                setShown(PAGE_SIZE);
              }}
              className="cursor-pointer underline hover:text-accent"
            >
              Clear filters
            </button>
          </li>
        ) : null}
      </ul>

      {hasMore ? (
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE_SIZE)}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Load {Math.min(PAGE_SIZE, visible.length - page.length)} more
          </button>
          <p className="!m-0 text-xs text-muted">
            Showing {page.length} of {visible.length}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-16 shrink-0 text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

const TONES: Record<string, string> = {
  easy: "text-easy",
  medium: "text-medium",
  hard: "text-hard",
};

function Chip({
  active,
  count,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  tone?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const disabled = count === 0 && !active;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${
        active
          ? "border-accent text-accent"
          : disabled
            ? "cursor-not-allowed border-border text-muted opacity-40"
            : `cursor-pointer border-border hover:border-accent ${tone ? TONES[tone] : ""}`
      }`}
    >
      {children} <span className="opacity-60">{count}</span>
    </button>
  );
}
