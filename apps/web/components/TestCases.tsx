"use client";

import { useState } from "react";
import {
  testChunkUrl,
  testDownloadUrl,
  testIndexUrl,
  type TestCase,
  type TestIndex,
} from "@/lib/tests";

/**
 * Loads a question's test cases on demand, 25 at a time.
 *
 * A question may carry thousands of cases. None of them are in the page HTML or
 * in the question's JavaScript chunk — they are static JSON files fetched only
 * after the reader presses the button, and only as far as they scroll.
 */
export function TestCases({ topic, slug }: { topic: string; slug: string }) {
  const [index, setIndex] = useState<TestIndex | null>(null);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadedChunks = index ? Math.ceil(cases.length / index.chunkSize) : 0;
  const hasMore = index !== null && loadedChunks < index.chunks;

  async function open() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(testIndexUrl(topic, slug));
      if (!res.ok) throw new Error(`index ${res.status}`);
      const meta: TestIndex = await res.json();

      const first = await fetch(testChunkUrl(topic, slug, 0));
      if (!first.ok) throw new Error(`chunk ${first.status}`);

      setIndex(meta);
      setCases(await first.json());
    } catch {
      setError("Could not load the test cases. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function more() {
    if (!index) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(testChunkUrl(topic, slug, loadedChunks));
      if (!res.ok) throw new Error(`chunk ${res.status}`);
      const next: TestCase[] = await res.json();
      setCases((prev) => [...prev, ...next]);
    } catch {
      setError("Could not load more cases. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (index === null) {
    return (
      <div className="my-4">
        <button
          type="button"
          onClick={open}
          disabled={loading}
          className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading ? "Loading…" : "Show test cases"}
        </button>
        {error ? <p className="mt-2 text-sm text-hard">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="my-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="!m-0 text-xs text-muted">
          Showing {cases.length} of {index.count}
        </p>
        <a
          href={testDownloadUrl(topic, slug)}
          download={`${slug}.tests.jsonl`}
          className="text-xs text-muted hover:text-accent"
        >
          Download all {index.count} ↓
        </a>
      </div>

      <ol className="mt-3 space-y-2">
        {cases.map((c, i) => (
          <li
            key={i}
            className="overflow-hidden rounded-lg border border-border bg-surface"
          >
            <div className="flex items-baseline gap-2 border-b border-border px-3 py-1.5">
              <span className="font-mono text-xs text-muted">#{i + 1}</span>
              {c.note ? <span className="text-xs text-muted">{c.note}</span> : null}
            </div>
            <div className="grid sm:grid-cols-2">
              <Pane label="input" value={c.in} />
              <Pane label="output" value={c.out} className="border-t sm:border-t-0 sm:border-l" />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex items-center gap-4">
        {hasMore ? (
          <button
            type="button"
            onClick={more}
            disabled={loading}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {loading ? "Loading…" : `Load ${index.chunkSize} more`}
          </button>
        ) : (
          <p className="!m-0 text-xs text-muted">All {index.count} cases loaded.</p>
        )}
        {error ? <p className="!m-0 text-sm text-hard">{error}</p> : null}
      </div>
    </div>
  );
}

function Pane({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`border-border px-3 py-2 ${className}`}>
      <p className="!m-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <pre className="!m-0 !border-0 !bg-transparent !p-0 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre">
        {value === "" ? <span className="text-muted">(empty)</span> : value}
      </pre>
    </div>
  );
}
