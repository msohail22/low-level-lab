import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Card, LinkButton } from "@/components/ui";
import type {
  DailyChallenge,
  DailyChallengeLeaderboardEntry,
} from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function DailyChallenge() {
  const { data, isPending, error } = useQuery({
    queryKey: ["daily-challenge"],
    queryFn: async () => {
      const res = await apiFetch<{
        challenge: DailyChallenge | null;
        leaderboard: DailyChallengeLeaderboardEntry[];
      }>("/api/learn/challenge/leaderboard");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  return (
    <AppShell eyebrow="Engagement" title="Daily challenge">
      <p className="section-copy mt-2">
        One approved question each UTC day. Correct solves today appear on the day board.
      </p>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      {data && !data.challenge && (
        <p className="mt-8 text-[color:var(--muted)]">
          No approved questions yet — contribute one to unlock the daily challenge.
        </p>
      )}

      {data?.challenge && (
        <Card className="mt-8 space-y-4 p-6">
          <p className="text-sm text-[color:var(--muted)]">
            {data.challenge.challengeDate} UTC
          </p>
          <p className="text-xl font-semibold text-[color:var(--ink)]">
            {data.challenge.title}
          </p>
          <p className="text-sm text-[color:var(--muted)]">
            {data.challenge.type} · {data.challenge.difficulty}
          </p>
          <LinkButton
            variant="primary"
            to={`/practice/${data.challenge.questionId}`}
          >
            Start challenge
          </LinkButton>
        </Card>
      )}

      <h2 className="mt-10 text-lg font-semibold text-[color:var(--ink)]">
        Today&apos;s board
      </h2>
      <ul className="mt-4 space-y-2">
        {data?.leaderboard.map((entry) => (
          <li
            key={entry.userId}
            className="flex items-center justify-between border-b border-[color:var(--line)] py-3 text-sm"
          >
            <span>
              #{entry.rank} {entry.name}
            </span>
            <Link
              className="text-[color:var(--accent)]"
              to={`/authors/${entry.userId}`}
            >
              Profile
            </Link>
          </li>
        ))}
      </ul>
      {data?.leaderboard.length === 0 && data.challenge && (
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          No correct solves yet today.
        </p>
      )}
    </AppShell>
  );
}
