import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, LinkButton, Textarea } from "@/components/ui";
import type { QuestionSetDetail, QuestionSetSummary } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function QuestionSets() {
  const { setId } = useParams();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const list = useQuery({
    queryKey: ["sets"],
    enabled: !setId,
    queryFn: async () => {
      const res = await apiFetch<{ sets: QuestionSetSummary[] }>("/api/learn/sets");
      if (res.error) throw new Error(res.error);
      return res.data!.sets;
    },
  });

  const detail = useQuery({
    queryKey: ["set", setId],
    enabled: Boolean(setId),
    queryFn: async () => {
      const res = await apiFetch<{ set: QuestionSetDetail }>(`/api/learn/sets/${setId}`);
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
                    to={`/practice/${item.questionId}?playlist=${set.slug}`}
                    className="block"
                  >
                    <Card className="p-5 transition hover:border-[color:var(--accent)]">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {item.type} · {item.difficulty}
                      </p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
            {set.items[0] && (
              <LinkButton
                variant="primary"
                className="mt-6"
                to={`/practice/${set.items[0].questionId}?playlist=${set.slug}`}
              >
                Practice this playlist
              </LinkButton>
            )}
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

      <Card className="mt-8 p-5">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <label className="block text-sm text-[color:var(--muted)]">
            Title
            <Input
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
            />
          </label>
          <label className="block text-sm text-[color:var(--muted)]">
            Description
            <Textarea
              className="mt-1 min-h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={create.isPending || title.trim().length < 3}
          >
            {create.isPending ? "Creating…" : "Create set"}
          </Button>
          {create.error && (
            <p className="text-sm text-red-700">{(create.error as Error).message}</p>
          )}
        </form>
      </Card>

      <ul className="mt-8 space-y-3">
        {list.data?.map((set) => (
          <li key={set.id}>
            <Link to={`/sets/${set.slug}`} className="block">
              <Card className="p-5 transition hover:border-[color:var(--accent)]">
                <p className="font-semibold text-[color:var(--ink)]">{set.title}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  by {set.ownerName}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
