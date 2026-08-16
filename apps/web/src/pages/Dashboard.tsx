import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { useMe } from "@/hooks/useMe";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth";

type Stats = {
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  todayAttemptCount: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { data: me } = useMe();
  const [loggingOut, setLoggingOut] = useState(false);
  const [goal, setGoal] = useState(3);

  const { data: stats } = useQuery({
    queryKey: ["learning-stats"],
    queryFn: async () => {
      const res = await apiFetch<{ stats: Stats }>("/api/learn/stats");
      if (res.error) throw new Error(res.error);
      setGoal(res.data!.stats.dailyGoal);
      return res.data!.stats;
    },
  });

  const saveGoal = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ stats: Stats }>("/api/learn/stats/goal", {
        method: "PATCH",
        body: JSON.stringify({ dailyGoal: goal }),
      });
      if (res.error) throw new Error(res.error);
      return res.data!.stats;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-stats"] }),
  });

  async function onLogout() {
    setLoggingOut(true);
    await authClient.signOut();
    setLoggingOut(false);
    navigate("/login", { replace: true });
  }

  return (
    <AppShell eyebrow="Learner" title="Welcome back">
      <p className="section-copy mt-2">
        Signed in as {session?.user.name || session?.user.email}.
      </p>

      <div className="surface-card mt-8 grid gap-4 p-6 sm:grid-cols-3">
        <div>
          <p className="text-sm text-[color:var(--muted)]">Streak</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats?.currentStreak ?? 0} days
          </p>
          <p className="text-xs text-[color:var(--muted)]">
            Best {stats?.longestStreak ?? 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-[color:var(--muted)]">Today</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats?.todayAttemptCount ?? 0}/{stats?.dailyGoal ?? 3}
          </p>
        </div>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveGoal.mutate();
          }}
        >
          <label className="block text-sm text-[color:var(--muted)]">
            Daily goal
            <input
              className="auth-input mt-1"
              type="number"
              min={1}
              max={50}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
            />
          </label>
          <button type="submit" className="auth-secondary-btn" disabled={saveGoal.isPending}>
            Save goal
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link className="auth-primary-btn text-center" to="/paths">
          Learning paths
        </Link>
        <Link className="auth-secondary-btn text-center" to="/topics">
          Practice topics
        </Link>
        <Link className="auth-secondary-btn text-center" to="/due">
          Spaced review
        </Link>
        <Link className="auth-secondary-btn text-center" to="/mistakes">
          My mistakes
        </Link>
        <Link className="auth-secondary-btn text-center" to="/bookmarks">
          Bookmarks
        </Link>
        <Link className="auth-secondary-btn text-center" to="/leaderboard">
          Leaderboard
        </Link>
        <Link className="auth-secondary-btn text-center" to="/contribute/questions">
          Contribute questions
        </Link>
        {me?.roles.reviewer && (
          <Link className="auth-secondary-btn text-center" to="/review/questions">
            Review queue
          </Link>
        )}
        {me?.roles.admin && (
          <Link className="auth-secondary-btn text-center" to="/admin">
            Admin console
          </Link>
        )}
      </div>

      <button
        className="auth-secondary-btn mt-8"
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
      >
        {loggingOut ? "Signing out…" : "Sign out"}
      </button>
    </AppShell>
  );
}
