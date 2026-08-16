import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { questionTypes, type QuestionType } from "@llb/shared";

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  SimpleSelect,
  Textarea,
} from "@/components/ui";
import { apiFetch } from "@/lib/api";

type Topic = { id: string; title: string; slug: string };

type OptionDraft = { label: string; body: string; isCorrect: boolean };

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  multi_select: "Multi-select",
  print_output: "What does this print?",
  spot_bug: "Spot the bug",
};

const TYPES = questionTypes.map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const LABELS = ["A", "B", "C", "D", "E", "F"];

function emptyOptions(): OptionDraft[] {
  return [
    { label: "A", body: "", isCorrect: true },
    { label: "B", body: "", isCorrect: false },
  ];
}

export default function NewQuestion() {
  const navigate = useNavigate();
  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const res = await apiFetch<{ topics: Topic[] }>("/api/questions/topics");
      if (res.error) throw new Error(res.error);
      return res.data!.topics;
    },
  });

  const [type, setType] = useState<QuestionType>("mcq");
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [whyWrong, setWhyWrong] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [booleanAnswer, setBooleanAnswer] = useState(true);
  const [options, setOptions] = useState<OptionDraft[]>(emptyOptions);
  const [hints, setHints] = useState(["", ""]);
  const [workedSolution, setWorkedSolution] = useState("");
  const [diagramMarkdown, setDiagramMarkdown] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async (status: "draft" | "pending") => {
      const hintList = hints.map((h) => h.trim()).filter(Boolean);
      const body =
        type === "true_false"
          ? {
              topicId,
              type,
              title,
              prompt,
              explanation,
              whyWrong: whyWrong || null,
              workedSolution: workedSolution || null,
              diagramMarkdown: diagramMarkdown || null,
              difficulty,
              codeSnippet: codeSnippet || null,
              status,
              booleanAnswer,
              options: [],
              hints: hintList,
            }
          : {
              topicId,
              type,
              title,
              prompt,
              explanation,
              whyWrong: whyWrong || null,
              workedSolution: workedSolution || null,
              diagramMarkdown: diagramMarkdown || null,
              difficulty,
              codeSnippet: codeSnippet || null,
              status,
              options,
              hints: hintList,
            };

      const res = await apiFetch("/api/questions", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => navigate("/contribute/questions"),
    onError: (err: Error) => setFormError(err.message),
  });

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((prev) => {
      const next = prev.map((opt, i) =>
        i === index ? { ...opt, ...patch } : opt,
      );
      if (patch.isCorrect && type !== "multi_select") {
        return next.map((opt, i) => ({ ...opt, isCorrect: i === index }));
      }
      return next;
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="section-eyebrow">Contribute</p>
      <h1 className="section-title mt-2">New question</h1>
      <p className="section-copy mt-2">
        MCQ, true/false, multi-select, print/output, or spot-the-bug. Submissions
        go to reviewers before learners see them.
      </p>

      <Card className="mt-8 p-6">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setFormError(null);
            create.mutate("pending");
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">Type</span>
            <SimpleSelect
              value={type}
              onValueChange={(next) => {
                const value = next as QuestionType;
                setType(value);
                if (value !== "true_false" && options.length < 2) {
                  setOptions(emptyOptions());
                }
              }}
              options={TYPES}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Topic</span>
            <SimpleSelect
              value={topicId || undefined}
              onValueChange={setTopicId}
              placeholder="Select a topic"
              options={(topics ?? []).map((t) => ({
                value: t.id,
                label: t.title,
              }))}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Difficulty</span>
            <SimpleSelect
              value={difficulty}
              onValueChange={setDifficulty}
              options={DIFFICULTY_OPTIONS}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Title</span>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Prompt</span>
            <Textarea
              className="min-h-28"
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Code snippet (optional)</span>
            <Textarea
              className="min-h-32 font-mono text-sm"
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
            />
          </label>

          {type === "true_false" ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Correct answer</legend>
              <label className="mr-4 inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={booleanAnswer === true}
                  onChange={() => setBooleanAnswer(true)}
                />
                True
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={booleanAnswer === false}
                  onChange={() => setBooleanAnswer(false)}
                />
                False
              </label>
            </fieldset>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Options</p>
                <button
                  type="button"
                  className="text-sm text-[color:var(--accent)]"
                  onClick={() =>
                    setOptions((prev) => [
                      ...prev,
                      {
                        label: LABELS[prev.length] ?? String(prev.length + 1),
                        body: "",
                        isCorrect: false,
                      },
                    ])
                  }
                >
                  Add option
                </button>
              </div>
              {options.map((opt, index) => (
                <div
                  key={opt.label + index}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <Input
                    className="sm:max-w-16"
                    value={opt.label}
                    onChange={(e) => updateOption(index, { label: e.target.value })}
                  />
                  <Input
                    className="flex-1"
                    placeholder="Option text"
                    value={opt.body}
                    onChange={(e) => updateOption(index, { body: e.target.value })}
                    required
                  />
                  <label className="inline-flex shrink-0 items-center gap-2 text-sm">
                    {type === "multi_select" ? (
                      <Checkbox
                        checked={opt.isCorrect}
                        onCheckedChange={(checked) =>
                          updateOption(index, { isCorrect: checked === true })
                        }
                      />
                    ) : (
                      <input
                        type="radio"
                        name="correct"
                        checked={opt.isCorrect}
                        onChange={(e) =>
                          updateOption(index, { isCorrect: e.target.checked })
                        }
                      />
                    )}
                    Correct
                  </label>
                </div>
              ))}
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium">Explanation</span>
            <Textarea
              className="min-h-28"
              required
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Why wrong (optional)</span>
            <Textarea
              className="min-h-20"
              value={whyWrong}
              onChange={(e) => setWhyWrong(e.target.value)}
              placeholder="Shown when the learner answers incorrectly"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Worked solution (optional)</span>
            <Textarea
              className="min-h-24"
              value={workedSolution}
              onChange={(e) => setWorkedSolution(e.target.value)}
              placeholder="Shown after a correct answer"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Diagram markdown (optional)</span>
            <Textarea
              className="min-h-24 font-mono text-sm"
              value={diagramMarkdown}
              onChange={(e) => setDiagramMarkdown(e.target.value)}
              placeholder="Mermaid or SVG markup"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Progressive hints (optional)</p>
              <button
                type="button"
                className="text-sm text-[color:var(--accent)]"
                onClick={() => setHints((prev) => [...prev, ""].slice(0, 5))}
              >
                Add hint
              </button>
            </div>
            {hints.map((hint, index) => (
              <Input
                key={index}
                placeholder={`Hint ${index + 1}`}
                value={hint}
                onChange={(e) =>
                  setHints((prev) =>
                    prev.map((h, i) => (i === index ? e.target.value : h)),
                  )
                }
              />
            ))}
          </div>

          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              disabled={create.isPending}
              onClick={() => {
                setFormError(null);
                create.mutate("draft");
              }}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={create.isPending}
            >
              {create.isPending ? "Saving…" : "Submit for review"}
            </Button>
          </div>
        </form>
      </Card>

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/contribute/questions">
        ← Back to my questions
      </Link>
    </main>
  );
}
