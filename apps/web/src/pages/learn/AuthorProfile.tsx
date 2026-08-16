import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

type Reputation = {
  authorId: string;
  name: string;
  approvedQuestionCount: number;
  followerCount: number;
  learnerAttempts: number;
  learnerCorrect: number;
  reputationScore: number;
};

export default function AuthorProfile() {
  const { authorId = "" } = useParams();
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: ["author-reputation", authorId],
    enabled: Boolean(authorId),
    queryFn: async () => {
      const res = await apiFetch<{ reputation: Reputation }>(
        `/api/learn/authors/${authorId}/reputation`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!.reputation;
    },
  });

  const followStatus = useQuery({
    queryKey: ["follow-status", authorId],
    enabled: Boolean(authorId),
    queryFn: async () => {
      const res = await apiFetch<{ following: boolean }>(
        `/api/learn/authors/${authorId}/follow/status`,
      );
      if (res.status === 401) return { following: false };
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (followStatus.data?.following) {
        const res = await apiFetch(`/api/learn/authors/${authorId}/follow`, {
          method: "DELETE",
        });
        if (res.error) throw new Error(res.error);
        return false;
      }
      const res = await apiFetch(`/api/learn/authors/${authorId}/follow`, {
        method: "POST",
      });
      if (res.error) throw new Error(res.error);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", authorId] });
      queryClient.invalidateQueries({
        queryKey: ["author-reputation", authorId],
      });
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
    },
  });

  return (
    <AppShell eyebrow="Author" title={data?.name ?? "Author"}>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}
      {data && (
        <>
          <div className="surface-card mt-8 grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[color:var(--muted)]">Reputation</p>
              <p className="mt-1 text-3xl font-semibold">{data.reputationScore}</p>
            </div>
            <div>
              <p className="text-sm text-[color:var(--muted)]">Approved questions</p>
              <p className="mt-1 text-2xl font-semibold">
                {data.approvedQuestionCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-[color:var(--muted)]">Followers</p>
              <p className="mt-1 text-2xl font-semibold">{data.followerCount}</p>
            </div>
            <div>
              <p className="text-sm text-[color:var(--muted)]">Learner corrects</p>
              <p className="mt-1 text-2xl font-semibold">
                {data.learnerCorrect}/{data.learnerAttempts}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="auth-primary-btn mt-6"
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
          >
            {followStatus.data?.following ? "Unfollow" : "Follow"}
          </button>
        </>
      )}
    </AppShell>
  );
}
