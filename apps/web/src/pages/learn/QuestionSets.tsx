import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

type SetRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ownerName: string;
};

type SetDetail = SetRow & {
  ownerId: string;
  items: {
    questionId: string;
    title: string;
    type: string;
    difficulty: string;
  }[];
};

export default function QuestionSets() {
  const { setId } = useParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const list = useQuery({
    queryKey: ["sets"],
    enabled: !setId,
    queryFn: async () => {
      const res = await apiFetch<{ sets: SetRow[] }>("/api/learn/sets");
      if (res.error) throw new Error(res.error);
      return res.data!.sets;
    },
  });

  const detail = useQuery({
    queryKey: ["set", setId],
    enabled: Boolean(setId),
    queryFn: async () => {
      const res = await apiFetch<{ set: SetDetail }>(`/api/learn/sets/${setId}`);
      if (res.error) throw new Error(res.error);
      return res.data!.set;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<{ id: string; slug: string }>("/api/learn/sets", {
        method: "POST",
        body: JSON.stringify({ title, description: description || undefined }),
      });
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["sets"] });
    },
  });

  if (setId) {
    const set = detail.data;
    return (
      <AppShell eyebrow="Curated set" title={set?.title ?? "Set"}>
        {detail.isPending && (
          <p className="mt-8 text-[color:var(--muted)]">Loading…</p>
        )}
        {set && (
          <>
            <p className="section-copy mt-2">
              {set.description || "A curated practice playlist."}
            </p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              By{" "}
              <Link className="text-[color:var(--accent)]" to={`/authors/${set.ownerId}`}>
                {set.ownerName}
              </Link>
            </p>
            <ul className="mt-8 space-y-3">
              {set.items.map((item) => (
                <li key={item.questionId}>
                  <Link
                    to={`/practice/${item.questionId}`}
                    className="surface-card block p-5 transition hover:border-[color:var(--accent)]"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {item.type} · {item.difficulty}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/sets">
              ← All sets
            </Link>
          </>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Engagement" title="Curated sets">
      <p className="section-copy mt-2">
        Public playlists of approved questions. Create one, then add items from practice.
      </p>

      <form
        className="surface-card mt-8 space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <label className="block text-sm text-[color:var(--muted)]">
          Title
          <input
            className="auth-input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
          />
        </label>
        <label className="block text-sm text-[color:var(--muted)]">
          Description
          <textarea
            className="auth-input mt-1 min-h-20"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="auth-primary-btn"
          disabled={create.isPending || title.trim().length < 3}
        >
          {create.isPending ? "Creating…" : "Create set"}
        </button>
        {create.error && (
          <p className="text-sm text-red-700">{(create.error as Error).message}</p>
        )}
      </form>

      <ul className="mt-8 space-y-3">
        {list.data?.map((set) => (
          <li key={set.id}>
            <Link
              to={`/sets/${set.slug}`}
              className="surface-card block p-5 transition hover:border-[color:var(--accent)]"
            >
              <p className="font-semibold text-[color:var(--ink)]">{set.title}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                by {set.ownerName}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
