import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import type { FollowingFeedItem } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function FollowingFeed() {
  const { data, isPending, error } = useQuery({
    queryKey: ["following-feed"],
    queryFn: async () => {
      const res = await apiFetch<{ items: FollowingFeedItem[] }>("/api/learn/feed");
      if (res.error) throw new Error(res.error);
      return res.data!.items;
    },
  });

  return (
    <AppShell eyebrow="Engagement" title="Following">
      <p className="section-copy mt-2">
        Approved questions from authors you follow.
      </p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}
      <ul className="mt-8 space-y-3">
        {data?.map((item) => (
          <li key={item.id}>
            <Link to={`/practice/${item.id}`} className="block">
              <Card className="p-5 transition hover:border-[color:var(--accent)]">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {item.type} · {item.difficulty} ·{" "}
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="text-[color:var(--accent)]"
                  >
                    {item.authorName}
                  </span>
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {data?.length === 0 && (
        <p className="mt-8 text-sm text-[color:var(--muted)]">
          Follow an author from any practice question to fill this feed.
        </p>
      )}
    </AppShell>
  );
}
