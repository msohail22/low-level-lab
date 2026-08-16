import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import type { GlossaryTerm } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function Glossary() {
  const { slug } = useParams();

  const list = useQuery({
    queryKey: ["glossary"],
    enabled: !slug,
    queryFn: async () => {
      const res = await apiFetch<{ terms: GlossaryTerm[] }>("/api/learn/glossary");
      if (res.error) throw new Error(res.error);
      return res.data!.terms;
    },
  });

  const detail = useQuery({
    queryKey: ["glossary", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await apiFetch<{ term: GlossaryTerm }>(`/api/learn/glossary/${slug}`);
      if (res.error) throw new Error(res.error);
      return res.data!.term;
    },
  });

  if (slug) {
    const term = detail.data;
    return (
      <AppShell eyebrow="Pedagogy" title={term?.term ?? "Concept"}>
        {detail.isPending && (
          <p className="mt-8 text-[color:var(--muted)]">Loading…</p>
        )}
        {term && (
          <>
            <p className="section-copy mt-4 whitespace-pre-wrap">
              {term.definition}
            </p>
            {term.topicTitle && (
              <p className="mt-4 text-sm text-[color:var(--muted)]">
                Related topic: {term.topicTitle}
              </p>
            )}
            <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/glossary">
              ← All terms
            </Link>
          </>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Pedagogy" title="Glossary">
      <p className="section-copy mt-2">
        Short concept cards for pointers, memory, RAII, and related ideas.
      </p>
      {list.isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      <ul className="mt-8 space-y-3">
        {list.data?.map((term) => (
          <li key={term.id}>
            <Link
              to={`/glossary/${term.slug}`}
              className="surface-card block p-5 transition hover:border-[color:var(--accent)]"
            >
              <p className="font-semibold text-[color:var(--ink)]">{term.term}</p>
              <p className="mt-2 line-clamp-2 text-sm text-[color:var(--muted)]">
                {term.definition}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
