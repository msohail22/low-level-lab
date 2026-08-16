import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { apiFetch } from "@/lib/api";

type PathRow = {
  id: string;
  title: string;
  description: string | null;
  progressPercent: number;
};

export default function Paths() {
  const { data, isPending, error } = useQuery({
    queryKey: ["learning-paths"],
    queryFn: async () => {
      const res = await apiFetch<{ paths: PathRow[] }>("/api/learn/paths");
      if (res.error) throw new Error(res.error);
      return res.data!.paths;
    },
  });

  return (
    <AppShell eyebrow="Learn" title="Learning paths">
      <p className="section-copy mt-2">
        Ordered topic sequences with progress based on correct answers.
      </p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}
      <ul className="mt-8 space-y-3">
        {data?.map((path) => (
          <li key={path.id}>
            <Link to={`/paths/${path.id}`} className="block">
              <Card className="p-5 transition hover:border-[color:var(--accent)]">
                <p className="font-semibold text-[color:var(--ink)]">{path.title}</p>
                {path.description && (
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {path.description}
                  </p>
                )}
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                  <div
                    className="h-full bg-[color:var(--accent-btn)]"
                    style={{ width: `${path.progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-[color:var(--accent)]">
                  {path.progressPercent}% complete
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
