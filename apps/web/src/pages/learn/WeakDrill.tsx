import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import type { WeakDrillItem } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function WeakDrill() {
  const { data, isPending, error } = useQuery({
    queryKey: ["weak-drill"],
    queryFn: async () => {
      const res = await apiFetch<{ items: WeakDrillItem[] }>("/api/learn/drill/weak");
      if (res.error) throw new Error(res.error);
      return res.data!.items;
    },
  });

  return (
    <AppShell eyebrow="Study loop" title="Weak-topic drill">
      <p className="section-copy mt-2">
        Recent incorrect answers — practice these to shore up soft spots.
      </p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}
      <ul className="mt-8 space-y-3">
        {data?.map((item) => (
          <li key={item.questionId}>
            <Link to={`/practice/${item.questionId}`} className="block">
              <Card className="p-5 transition hover:border-[color:var(--accent)]">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {item.topicTitle} · {item.type} · {item.difficulty}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {data?.length === 0 && (
        <p className="mt-8 text-sm text-[color:var(--muted)]">
          No wrong answers yet — keep practicing.
        </p>
      )}
    </AppShell>
  );
}
