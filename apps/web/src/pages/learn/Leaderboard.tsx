import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import type { LeaderboardEntry } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function Leaderboard() {
  const { data, isPending, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await apiFetch<{ leaderboard: LeaderboardEntry[] }>("/api/leaderboard");
      if (res.error) throw new Error(res.error);
      return res.data!.leaderboard;
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Compete</p>
      <h1 className="section-title mt-2">Leaderboard</h1>
      <p className="section-copy mt-2">
        Ranked by correct answers (one attempt per question).
      </p>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      <div className="surface-card mt-8 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b border-[color:var(--line)] text-[color:var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Learner</th>
              <th className="px-4 py-3 font-medium">Correct</th>
              <th className="px-4 py-3 font-medium">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((entry) => (
              <tr
                key={entry.userId}
                className="border-b border-[color:var(--line)] last:border-0"
              >
                <td className="px-4 py-3">{entry.rank}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[color:var(--ink)]">{entry.name}</p>
                  <p className="text-[color:var(--muted)]">{entry.email}</p>
                </td>
                <td className="px-4 py-3">{entry.correctCount}</td>
                <td className="px-4 py-3">{entry.attemptCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && (
          <p className="p-6 text-[color:var(--muted)]">No attempts yet.</p>
        )}
      </div>

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/dashboard">
        ← Back to dashboard
      </Link>
    </main>
  );
}
