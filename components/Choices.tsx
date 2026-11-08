"use client";

import { Fragment, useState } from "react";
import type { Choice } from "@/lib/schema";

/**
 * Renders `text` with inline `code` spans. Splits on backticks rather than
 * running a markdown parser, and never sets innerHTML, so a contributed
 * question cannot inject markup.
 */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded bg-border/60 px-1 py-0.5 font-mono text-[0.85em]"
          >
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function Choices({
  choices,
  multiple,
}: {
  choices: Choice[];
  multiple: boolean;
}) {
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<"right" | "wrong" | null>(null);

  function toggle(i: number) {
    setResult(null);
    setPicked((prev) => {
      if (!multiple) return new Set([i]);
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function submit() {
    const correct = choices.flatMap((c, i) => (c.correct ? [i] : []));
    const right =
      picked.size === correct.length && correct.every((i) => picked.has(i));
    setResult(right ? "right" : "wrong");
  }

  return (
    <section className="my-8">
      <ul className="space-y-2">
        {choices.map((choice, i) => {
          const isPicked = picked.has(i);

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={isPicked}
                className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border bg-surface px-4 py-3 text-left text-sm hover:border-accent ${
                  isPicked ? "border-accent" : "border-border"
                }`}
              >
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center border text-[10px] ${
                    multiple ? "rounded-sm" : "rounded-full"
                  } ${isPicked ? "border-accent bg-accent text-on-accent" : "border-border"}`}
                  aria-hidden
                >
                  {isPicked ? "✓" : ""}
                </span>
                <span className="flex-1">
                  <Inline text={choice.text} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={submit}
          disabled={picked.size === 0}
          className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit answer
        </button>

        {result ? (
          <span
            role="status"
            className={`text-sm font-semibold ${
              result === "right" ? "text-easy" : "text-hard"
            }`}
          >
            {result === "right" ? "Correct" : "Wrong"}
          </span>
        ) : null}
      </div>
    </section>
  );
}
