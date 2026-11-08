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
  const [checked, setChecked] = useState(false);

  function toggle(i: number) {
    if (checked) return;
    setPicked((prev) => {
      if (!multiple) return new Set([i]);
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const correctIndexes = choices.flatMap((c, i) => (c.correct ? [i] : []));
  const allRight =
    picked.size === correctIndexes.length &&
    correctIndexes.every((i) => picked.has(i));

  return (
    <section className="my-8">
      <p className="mb-3 text-xs text-muted">
        {multiple ? "Select every correct option." : "Select one option."}
      </p>

      <ul className="space-y-2">
        {choices.map((choice, i) => {
          const isPicked = picked.has(i);
          const reveal = checked;

          let tone = "border-border";
          if (reveal && choice.correct) tone = "border-easy";
          else if (reveal && isPicked) tone = "border-hard";
          else if (isPicked) tone = "border-accent";

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                disabled={checked}
                aria-pressed={isPicked}
                className={`flex w-full items-start gap-3 rounded-lg border bg-surface px-4 py-3 text-left text-sm ${tone} ${
                  checked ? "cursor-default" : "cursor-pointer hover:border-accent"
                }`}
              >
                <span
                  className={`mt-0.5 grid size-4 shrink-0 place-items-center border text-[10px] ${
                    multiple ? "rounded-sm" : "rounded-full"
                  } ${isPicked ? "border-accent bg-accent text-white" : "border-border"}`}
                  aria-hidden
                >
                  {isPicked ? "✓" : ""}
                </span>

                <span className="flex-1">
                  <Inline text={choice.text} />

                  {reveal && choice.why ? (
                    <span className="mt-1.5 block text-xs text-muted">
                      <Inline text={choice.why} />
                    </span>
                  ) : null}
                </span>

                {reveal ? (
                  <span
                    className={`shrink-0 text-xs font-semibold ${
                      choice.correct ? "text-easy" : isPicked ? "text-hard" : "text-muted"
                    }`}
                  >
                    {choice.correct ? "correct" : isPicked ? "wrong" : ""}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        {checked ? (
          <>
            <span
              className={`text-sm font-semibold ${allRight ? "text-easy" : "text-hard"}`}
            >
              {allRight ? "Correct" : "Not quite"}
            </span>
            <button
              type="button"
              onClick={() => {
                setChecked(false);
                setPicked(new Set());
              }}
              className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent"
            >
              Try again
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={picked.size === 0}
            className="cursor-pointer rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check answer
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        Grading happens in your browser. Nothing is sent anywhere. Read the
        explanation below either way.
      </p>
    </section>
  );
}
