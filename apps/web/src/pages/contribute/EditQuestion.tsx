import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { EditableQuestion } from "@llb/shared";

import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

function EditForm({ data }: { data: EditableQuestion }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(data.title);
  const [prompt, setPrompt] = useState(data.prompt);
  const [explanation, setExplanation] = useState(data.explanation);
  const [whyWrong, setWhyWrong] = useState(data.whyWrong ?? "");
  const [workedSolution, setWorkedSolution] = useState(data.workedSolution ?? "");
  const [diagramMarkdown, setDiagramMarkdown] = useState(
    data.diagramMarkdown ?? "",
  );
  const [requireReReview, setRequireReReview] = useState(true);

  const save = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/questions/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          prompt,
          explanation,
          whyWrong: whyWrong || null,
          workedSolution: workedSolution || null,
          diagramMarkdown: diagramMarkdown || null,
          requireReReview,
        }),
      });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["edit-question", data.id] });
      queryClient.invalidateQueries({ queryKey: ["my-questions"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <form
      className="surface-card mt-8 space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <label className="block space-y-2 text-sm">
        Title
        <input
          className="auth-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        Prompt
        <textarea
          className="auth-input min-h-28"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        Explanation
        <textarea
          className="auth-input min-h-28"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        Why wrong
        <textarea
          className="auth-input min-h-20"
          value={whyWrong}
          onChange={(e) => setWhyWrong(e.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        Worked solution
        <textarea
          className="auth-input min-h-28"
          value={workedSolution}
          onChange={(e) => setWorkedSolution(e.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        Diagram (mermaid or SVG markup)
        <textarea
          className="auth-input min-h-28 font-mono text-sm"
          value={diagramMarkdown}
          onChange={(e) => setDiagramMarkdown(e.target.value)}
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={requireReReview}
          onChange={(e) => setRequireReReview(e.target.checked)}
        />
        Send approved questions back for re-review
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" className="auth-primary-btn" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save version"}
      </button>
    </form>
  );
}

export default function EditQuestion() {
  const { questionId = "" } = useParams();

  const { data, isPending } = useQuery({
    queryKey: ["edit-question", questionId],
    enabled: Boolean(questionId),
    queryFn: async () => {
      const res = await apiFetch<{
        question: { question: EditableQuestion };
      }>(`/api/questions/${questionId}`);
      if (res.error) throw new Error(res.error);
      return res.data!.question.question;
    },
  });

  return (
    <AppShell eyebrow="Contribute" title="Edit question">
      <p className="section-copy mt-2">
        Edits create a new version snapshot. For approved questions, re-review
        sends the item back to pending.
      </p>
      {isPending && <p className="mt-8 text-[color:var(--muted)]">Loading…</p>}
      {data && <EditForm key={data.id + data.status} data={data} />}
      <Link
        className="mt-8 inline-block text-sm text-[color:var(--accent)]"
        to="/contribute/questions"
      >
        ← My questions
      </Link>
    </AppShell>
  );
}
