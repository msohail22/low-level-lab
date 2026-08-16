import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

type Stats = {
  pendingCount: number;
  approvedCount: number;
  topicCount: number;
};

export default function AdminHome() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await apiFetch<{ stats: Stats }>("/api/admin/stats");
      if (res.error) throw new Error(res.error);
      return res.data!.stats;
    },
  });

  const grant = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/admin/reviewers", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setMessage("Reviewer granted via OpenFGA.");
      setUserId("");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  return (
    <AppShell eyebrow="Admin" title="Admin console">
      <p className="section-copy mt-2">
        Platform overview and reviewer grants. Local fallback: set{" "}
        <code>ADMIN_USER_IDS</code> / <code>REVIEWER_USER_IDS</code> in wrangler.
      </p>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      {data && (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="surface-card p-5">
            <p className="text-sm text-[color:var(--muted)]">Pending</p>
            <p className="mt-1 text-2xl font-semibold">{data.pendingCount}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm text-[color:var(--muted)]">Approved</p>
            <p className="mt-1 text-2xl font-semibold">{data.approvedCount}</p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm text-[color:var(--muted)]">Topics</p>
            <p className="mt-1 text-2xl font-semibold">{data.topicCount}</p>
          </div>
        </div>
      )}

      <form
        className="surface-card mt-8 space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          grant.mutate();
        }}
      >
        <p className="font-medium text-[color:var(--ink)]">Grant reviewer</p>
        <input
          className="auth-input"
          placeholder="User id"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <button type="submit" className="auth-primary-btn" disabled={grant.isPending}>
          {grant.isPending ? "Granting…" : "Grant reviewer"}
        </button>
        {message && <p className="text-sm text-[color:var(--muted)]">{message}</p>}
      </form>

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/review/questions">
        Open review queue →
      </Link>
    </AppShell>
  );
}
