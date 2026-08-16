import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiFetch } from "@/lib/api";

type Topic = { id: string; title: string; slug: string };

type OptionDraft = { label: string; body: string; isCorrect: boolean };

const TYPES = [
  { value: "mcq", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "multi_select", label: "Multi-select" },
  { value: "print_output", label: "What does this print?" },
  { value: "spot_bug", label: "Spot the bug" },
] as const;

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

  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("mcq");
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

      <form
        className="surface-card mt-8 space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setFormError(null);
          create.mutate("pending");
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Type</span>
          <select
            className="auth-input"
            value={type}
            onChange={(e) => {
              const next = e.target.value as (typeof TYPES)[number]["value"];
              setType(next);
              if (next !== "true_false" && options.length < 2) {
                setOptions(emptyOptions());
              }
            }}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Topic</span>
          <select
            className="auth-input"
            required
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
          >
            <option value="">Select a topic</option>
            {topics?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Difficulty</span>
          <select
            className="auth-input"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Title</span>
          <input
            className="auth-input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Prompt</span>
          <textarea
            className="auth-input min-h-28"
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Code snippet (optional)</span>
          <textarea
            className="auth-input min-h-32 font-mono text-sm"
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
              <div key={opt.label + index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="auth-input sm:max-w-16"
                  value={opt.label}
                  onChange={(e) => updateOption(index, { label: e.target.value })}
                />
                <input
                  className="auth-input flex-1"
                  placeholder="Option text"
                  value={opt.body}
                  onChange={(e) => updateOption(index, { body: e.target.value })}
                  required
                />
                <label className="inline-flex shrink-0 items-center gap-2 text-sm">
                  <input
                    type={type === "multi_select" ? "checkbox" : "radio"}
                    name="correct"
                    checked={opt.isCorrect}
                    onChange={(e) =>
                      updateOption(index, { isCorrect: e.target.checked })
                    }
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-medium">Explanation</span>
          <textarea
            className="auth-input min-h-28"
            required
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Why wrong (optional)</span>
          <textarea
            className="auth-input min-h-20"
            value={whyWrong}
            onChange={(e) => setWhyWrong(e.target.value)}
            placeholder="Shown when the learner answers incorrectly"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Worked solution (optional)</span>
          <textarea
            className="auth-input min-h-24"
            value={workedSolution}
            onChange={(e) => setWorkedSolution(e.target.value)}
            placeholder="Shown after a correct answer"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Diagram markdown (optional)</span>
          <textarea
            className="auth-input min-h-24 font-mono text-sm"
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
            <input
              key={index}
              className="auth-input"
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

        {formError && <p className="text-sm text-red-700">{formError}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="auth-secondary-btn"
            disabled={create.isPending}
            onClick={() => {
              setFormError(null);
              create.mutate("draft");
            }}
          >
            Save draft
          </button>
          <button type="submit" className="auth-primary-btn" disabled={create.isPending}>
            {create.isPending ? "Saving…" : "Submit for review"}
          </button>
        </div>
      </form>

      <Link className="mt-8 inline-block text-sm text-[color:var(--accent)]" to="/contribute/questions">
        ← Back to my questions
      </Link>
    </main>
  );
}
