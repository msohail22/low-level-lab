import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { Alert, Badge, Card } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { DiffToken, QuestionDiffResponse } from "@llb/shared";

type QuestionVersionMeta = {
  id: string;
  version: number;
  editorId: string | null;
  createdAt: string;
};

export default function QuestionDiffViewer() {
  const { questionId } = useParams<{ questionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const v1Param = Number(searchParams.get("v1") || 1);
  const v2Param = Number(searchParams.get("v2") || 2);

  const [v1, setV1] = useState<number>(v1Param);
  const [v2, setV2] = useState<number>(v2Param);

  // Fetch all version list for question
  const { data: versionListData, isPending: isVersionsPending } = useQuery({
    queryKey: ["question-versions", questionId],
    queryFn: async () => {
      if (!questionId) return [];
      const res = await apiFetch<{ versions: QuestionVersionMeta[] }>(
        `/api/learn/questions/${questionId}/versions`,
      );
      if (res.error) throw new Error(res.error);
      return res.data?.versions || [];
    },
    enabled: Boolean(questionId),
  });

  // Fetch diff comparison between v1 and v2
  const {
    data: diffData,
    isPending: isDiffPending,
    error: diffError,
  } = useQuery({
    queryKey: ["question-version-diff", questionId, v1, v2],
    queryFn: async () => {
      if (!questionId) return null;
      const res = await apiFetch<QuestionDiffResponse>(
        `/api/learn/questions/${questionId}/versions/diff?v1=${v1}&v2=${v2}`,
      );
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    enabled: Boolean(questionId && v1 && v2),
  });

  const handleVersionChange = (newV1: number, newV2: number) => {
    setV1(newV1);
    setV2(newV2);
    setSearchParams({ v1: String(newV1), v2: String(newV2) });
  };

  const versions = versionListData || [];

  return (
    <AppShell eyebrow="Review & Moderation" title="Question Version Diff">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="section-copy">
          Compare revisions side-by-side to review historical modifications.
        </p>
        <Link
          to="/review/questions"
          className="text-sm font-medium text-[color:var(--accent)] hover:underline"
        >
          ← Back to review queue
        </Link>
      </div>

      {/* Version Selection Controls */}
      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]">
                Base Version (v1)
              </label>
              <select
                value={v1}
                onChange={(e) => handleVersionChange(Number(e.target.value), v2)}
                className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1.5 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              >
                {versions.map((ver) => (
                  <option key={ver.id} value={ver.version}>
                    Version {ver.version} ({new Date(ver.createdAt).toLocaleDateString()})
                  </option>
                ))}
                {versions.length === 0 && <option value={1}>Version 1</option>}
              </select>
            </div>

            <span className="mt-5 text-sm font-bold text-[color:var(--muted)]">vs</span>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)]">
                Target Version (v2)
              </label>
              <select
                value={v2}
                onChange={(e) => handleVersionChange(v1, Number(e.target.value))}
                className="rounded-md border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-1.5 text-sm text-[color:var(--ink)] focus:border-[color:var(--accent)] focus:outline-none"
              >
                {versions.map((ver) => (
                  <option key={ver.id} value={ver.version}>
                    Version {ver.version} ({new Date(ver.createdAt).toLocaleDateString()})
                  </option>
                ))}
                {versions.length === 0 && <option value={2}>Version 2</option>}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
            <span className="inline-flex items-center gap-1 rounded bg-[color:var(--danger-bg)] px-2 py-0.5 font-medium text-[color:var(--danger)]">
              Removed (v1)
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-[color:var(--success-bg)] px-2 py-0.5 font-medium text-[color:var(--success)]">
              Added (v2)
            </span>
          </div>
        </div>
      </Card>

      {(isVersionsPending || isDiffPending) && (
        <p className="mt-8 text-[color:var(--muted)]">Loading diff comparison…</p>
      )}

      {diffError && (
        <Alert className="mt-6" variant="error">
          {(diffError as Error).message}
        </Alert>
      )}

      {diffData && (
        <div className="mt-8 space-y-6">
          {/* Metadata Comparison */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted)]">
              Metadata Comparison
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-xs text-[color:var(--muted)]">Title:</span>
                {diffData.diff.title.changed ? (
                  <div className="mt-1 space-y-1">
                    <p className="rounded bg-[color:var(--danger-bg)] p-2 text-sm text-[color:var(--danger)] line-through">
                      {diffData.diff.title.old || "(Empty)"}
                    </p>
                    <p className="rounded bg-[color:var(--success-bg)] p-2 text-sm text-[color:var(--success)]">
                      {diffData.diff.title.new || "(Empty)"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm font-medium text-[color:var(--fg-bright)]">
                    {diffData.diff.title.new || "(Unchanged)"}
                  </p>
                )}
              </div>

              <div>
                <span className="text-xs text-[color:var(--muted)]">Difficulty:</span>
                {diffData.diff.difficulty.changed ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="warn">
                      {diffData.diff.difficulty.old}
                    </Badge>
                    <span className="text-xs text-[color:var(--muted)]">→</span>
                    <Badge variant="success">
                      {diffData.diff.difficulty.new}
                    </Badge>
                  </div>
                ) : (
                  <div className="mt-1">
                    <Badge variant="muted">{diffData.diff.difficulty.new || "Normal"}</Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Prompt Diff */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted)]">
              Question Prompt Diff
            </h3>
            <div className="mt-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas)] p-4 text-sm leading-relaxed text-[color:var(--ink)]">
              <DiffTextRenderer tokens={diffData.diff.prompt} />
            </div>
          </Card>

          {/* Explanation Diff */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted)]">
              Explanation Diff
            </h3>
            <div className="mt-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--canvas)] p-4 text-sm leading-relaxed text-[color:var(--ink)]">
              <DiffTextRenderer tokens={diffData.diff.explanation} />
            </div>
          </Card>

          {/* Code Snippet Diff */}
          {diffData.diff.codeSnippet && diffData.diff.codeSnippet.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted)]">
                Code Snippet Diff
              </h3>
              <pre className="matte-code-block mt-3 whitespace-pre-wrap leading-relaxed">
                <DiffTextRenderer tokens={diffData.diff.codeSnippet} />
              </pre>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}

function DiffTextRenderer({ tokens }: { tokens: DiffToken[] }) {
  if (!tokens || tokens.length === 0) {
    return <span className="italic text-[color:var(--muted)]">No content available.</span>;
  }

  return (
    <span>
      {tokens.map((token, idx) => {
        if (token.added) {
          return (
            <mark
              key={idx}
              className="mx-0.5 rounded bg-[color:var(--success-bg)] px-1 py-0.5 text-[color:var(--success)] font-medium"
            >
              {token.value}
            </mark>
          );
        }
        if (token.removed) {
          return (
            <del
              key={idx}
              className="mx-0.5 rounded bg-[color:var(--danger-bg)] px-1 py-0.5 text-[color:var(--danger)] line-through"
            >
              {token.value}
            </del>
          );
        }
        return <span key={idx}>{token.value}</span>;
      })}
    </span>
  );
}
