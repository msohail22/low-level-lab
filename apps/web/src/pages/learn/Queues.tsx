import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import type { QueueItem } from "@llb/shared";

import { apiFetch } from "@/lib/api";

function QuestionListPage({
  eyebrow,
  title,
  copy,
  queryKey,
  path,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  queryKey: string;
  path: string;
}) {
  const { data, isPending, error } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await apiFetch<{ items: QueueItem[] }>(path);
      if (res.error) throw new Error(res.error);
      return res.data!.items;
    },
  });

  return (
    <AppShell eyebrow={eyebrow} title={title}>
      <p className="section-copy mt-2">{copy}</p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}
      <ul className="mt-8 space-y-3">
        {data?.map((item) => (
          <li key={item.questionId}>
            <Link to={`/practice/${item.questionId}`} className="block">
              <Card className="p-5 transition hover:border-[color:var(--accent)]">
                <p className="font-semibold text-[color:var(--ink)]">{item.title}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {item.type} · {item.difficulty}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {data?.length === 0 && (
        <p className="mt-8 text-[color:var(--muted)]">Nothing here yet.</p>
      )}
    </AppShell>
  );
}

export function DueReviews() {
  return (
    <QuestionListPage
      eyebrow="Review"
      title="Due for spaced review"
      copy="Wrong or aging questions resurface here when they are due."
      queryKey="due-reviews"
      path="/api/learn/due"
    />
  );
}

export function Mistakes() {
  return (
    <QuestionListPage
      eyebrow="Review"
      title="My mistakes"
      copy="Questions you got wrong — jump back in and try again from spaced review after another attempt cycle."
      queryKey="mistakes"
      path="/api/learn/mistakes"
    />
  );
}

export function Bookmarks() {
  return (
    <QuestionListPage
      eyebrow="Save"
      title="Bookmarks"
      copy="Questions you saved for later."
      queryKey="bookmarks"
      path="/api/learn/bookmarks"
    />
  );
}
