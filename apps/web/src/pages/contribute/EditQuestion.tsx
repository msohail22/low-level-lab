import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { EditableQuestion } from "@llb/shared";

import { AppShell } from "@/components/AppShell";
import { Alert, Button, Card, Checkbox, Input, Textarea } from "@/components/ui";
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
    <Card className="mt-8 p-6">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <label className="block space-y-2 text-sm">
          Title
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block space-y-2 text-sm">
          Prompt
          <Textarea
            className="min-h-28"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm">
          Explanation
          <Textarea
            className="min-h-28"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm">
          Why wrong
          <Textarea
            className="min-h-20"
            value={whyWrong}
            onChange={(e) => setWhyWrong(e.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm">
          Worked solution
          <Textarea
            className="min-h-28"
            value={workedSolution}
            onChange={(e) => setWorkedSolution(e.target.value)}
          />
        </label>
        <label className="block space-y-2 text-sm">
          Diagram (mermaid or SVG markup)
          <Textarea
            className="min-h-28 font-mono text-sm"
            value={diagramMarkdown}
            onChange={(e) => setDiagramMarkdown(e.target.value)}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <Checkbox
            checked={requireReReview}
            onCheckedChange={(checked) => setRequireReReview(checked === true)}
          />
          Send approved questions back for re-review
        </label>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" variant="primary" fullWidth disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save version"}
        </Button>
      </form>
    </Card>
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
