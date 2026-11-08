"use client";

import { useState } from "react";

/**
 * A free-text answer box for the kinds that have no options to click.
 *
 * When the question carries an `expected` string (predict-output only) the
 * answer is graded in the browser and reports right or wrong. Otherwise the
 * box is somewhere to commit to an answer before revealing the real one, which
 * is the point: writing it down first is what makes the reveal useful.
 */
export function Response({
  expected,
  placeholder,
}: {
  expected?: string;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"right" | "wrong" | "noted" | null>(null);

  // Trailing whitespace on a line, and a missing or extra final newline, are
  // not mistakes worth failing someone for.
  function normalise(text: string) {
    return text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
  }

  function submit() {
    if (expected === undefined) {
      setResult("noted");
      return;
    }
    setResult(normalise(value) === normalise(expected) ? "right" : "wrong");
  }

  return (
    <section className="my-6">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setResult(null);
        }}
        rows={6}
        spellCheck={false}
        placeholder={placeholder}
        aria-label="Your answer"
        className="block w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm leading-relaxed outline-none placeholder:text-muted focus:border-accent"
      />

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={submit}
          disabled={value.trim() === ""}
          className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit answer
        </button>

        {result === "right" ? (
          <span role="status" className="text-sm font-semibold text-easy">
            Correct
          </span>
        ) : null}
        {result === "wrong" ? (
          <span role="status" className="text-sm font-semibold text-hard">
            Wrong
          </span>
        ) : null}
        {result === "noted" ? (
          <span role="status" className="text-sm text-muted">
            Answer saved. Open it below and compare.
          </span>
        ) : null}
      </div>
    </section>
  );
}
