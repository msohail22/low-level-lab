import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, LinkButton } from "@/components/ui";
import { useMe } from "@/hooks/useMe";
import type { ContinueState, LearningStats } from "@llb/shared";

import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth";

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
      const res = await apiFetch<{ stats: LearningStats }>("/api/learn/stats");
      if (res.error) throw new Error(res.error);
      setGoal(res.data!.stats.dailyGoal);
      return res.data!.stats;
    },
  });

  const { data: cont } = useQuery({
    queryKey: ["continue"],
    queryFn: async () => {
      const res = await apiFetch<{
        continue: ContinueState | null;
      }>("/api/learn/continue");
      if (res.error) throw new Error(res.error);
      return res.data!.continue;
    },
  });

  const saveGoal = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ stats: LearningStats }>("/api/learn/stats/goal", {
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

      <Card className="mt-8 grid gap-4 p-6 sm:grid-cols-3">
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
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={50}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
            />
          </label>
          <Button type="submit" variant="secondary" disabled={saveGoal.isPending}>
            Save goal
          </Button>
        </form>
      </Card>

      {cont && (cont.lastQuestionId || cont.dueCount > 0 || cont.lastTopicId) && (
        <Card className="mt-6 space-y-3 p-5">
          <p className="font-semibold">Continue where you left off</p>
          {cont.dueCount > 0 && (
            <Link className="block text-sm text-[color:var(--accent)]" to="/due">
              {cont.dueCount} review{cont.dueCount === 1 ? "" : "s"} due →
            </Link>
          )}
          {cont.lastQuestionId && (
            <Link
              className="block text-sm text-[color:var(--accent)]"
              to={`/practice/${cont.lastQuestionId}`}
            >
              Resume: {cont.lastQuestionTitle ?? "last question"} →
            </Link>
          )}
          {cont.lastTopicId && (
            <Link
              className="block text-sm text-[color:var(--accent)]"
              to={`/topics/${cont.lastTopicId}`}
            >
              Topic: {cont.lastTopicTitle ?? "last topic"} →
            </Link>
          )}
          {cont.lastPathId && (
            <Link
              className="block text-sm text-[color:var(--accent)]"
              to={`/paths/${cont.lastPathId}`}
            >
              Path: {cont.lastPathTitle ?? "last path"} →
            </Link>
          )}
        </Card>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <LinkButton variant="primary" fullWidth className="text-center" to="/playground">
          Reactor playground
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/paths">
          Learning paths
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/challenge">
          Daily challenge
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/topics">
          Practice topics
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/drill">
          Weak-topic drill
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/due">
          Spaced review
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/mistakes">
          My mistakes
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/bookmarks">
          Bookmarks
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/achievements">
          Achievements
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/feed">
          Following feed
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/sets">
          Curated sets
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/glossary">
          Glossary
        </LinkButton>
        <LinkButton variant="secondary" fullWidth className="text-center" to="/leaderboard">
          Leaderboard
        </LinkButton>
        <LinkButton
          variant="secondary"
          fullWidth
          className="text-center"
          to="/contribute/questions"
        >
          Contribute questions
        </LinkButton>
        {me?.roles.reviewer && (
          <LinkButton
            variant="secondary"
            fullWidth
            className="text-center"
            to="/review/questions"
          >
            Review queue
          </LinkButton>
        )}
        {me?.roles.admin && (
          <LinkButton variant="secondary" fullWidth className="text-center" to="/admin">
            Admin console
          </LinkButton>
        )}
      </div>

      <Button
        className="mt-8"
        variant="secondary"
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
      >
        {loggingOut ? "Signing out…" : "Sign out"}
      </Button>
    </AppShell>
  );
}
