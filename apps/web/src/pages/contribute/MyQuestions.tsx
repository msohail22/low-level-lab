import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { FilterSelect } from "@/components/QuestionFilters";
import { Button, Card, LinkButton } from "@/components/ui";
import {
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "@/lib/filter-options";
import type { MyQuestionRow } from "@llb/shared";

import { apiFetch } from "@/lib/api";

export default function MyQuestions() {
  const queryClient = useQueryClient();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const { data, isPending, error } = useQuery({
    queryKey: ["my-questions", type, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (status) params.set("status", status);
      const qs = params.toString();
      const res = await apiFetch<{ questions: MyQuestionRow[] }>(
        `/api/questions/mine${qs ? `?${qs}` : ""}`,
      );
      if (res.error) throw new Error(res.error);
      return res.data!.questions;
    },
  });

  const submit = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/questions/${id}/submit`, {
        method: "POST",
        body: "{}",
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-questions"] }),
  });

  return (
    <AppShell eyebrow="Contribute" title="My questions">
      <p className="section-copy mt-2">
        Draft locally, submit for review, and track approvals.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <FilterSelect
            label="Type"
            value={type}
            onChange={setType}
            options={TYPE_FILTER_OPTIONS}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>
        <LinkButton
          variant="primary"
          className="shrink-0 text-center"
          to="/contribute/questions/new"
        >
          New question
        </LinkButton>
      </div>

      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-700">{(error as Error).message}</p>
      )}

      <ul className="mt-8 space-y-3">
        {data?.map((q) => (
          <li key={q.id}>
            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[color:var(--ink)]">{q.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {q.type} · {q.difficulty} · {q.status}
                  </p>
                  {q.reviewNote && (
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      Review note: {q.reviewNote}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <LinkButton
                    variant="secondary"
                    className="text-center"
                    to={`/contribute/questions/${q.id}/edit`}
                  >
                    Edit
                  </LinkButton>
                  {(q.status === "draft" || q.status === "rejected") && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={submit.isPending}
                      onClick={() => submit.mutate(q.id)}
                    >
                      Submit for review
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {data?.length === 0 && (
        <p className="mt-8 text-[color:var(--muted)]">
          No questions match these filters.
        </p>
      )}
    </AppShell>
  );
}
