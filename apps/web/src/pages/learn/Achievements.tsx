import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import type { Achievement } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function Achievements() {
  const { data, isPending, error } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await apiFetch<{ achievements: Achievement[] }>(
        "/api/learn/achievements",
      );
      if (res.error) throw new Error(res.error);
      return res.data!.achievements;
    },
  });

  return (
    <AppShell eyebrow="Engagement" title="Achievements">
      <p className="section-copy mt-2">
        Badges unlock from correct answers, streaks, challenges, and contributions.
      </p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {data?.map((a) => (
          <li
            key={a.id}
            className={`surface-card p-5 ${
              a.earnedAt ? "border-[color:var(--accent)]" : "opacity-70"
            }`}
          >
            <p className="font-semibold text-[color:var(--ink)]">{a.title}</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {a.description}
            </p>
            <p className="mt-3 text-xs text-[color:var(--muted)]">
              {a.earnedAt
                ? `Earned ${new Date(a.earnedAt).toLocaleDateString()}`
                : "Locked"}
            </p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
