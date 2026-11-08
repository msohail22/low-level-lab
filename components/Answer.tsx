"use client";

import { useState, type ReactNode } from "react";

/**
 * The answer reveal. Authors put it last in the MDX file and the validator
 * enforces that, so the button always sits at the bottom of the page.
 */
export function Answer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="mt-10 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
        >
          Show answer
        </button>
      </div>
    );
  }

  return (
    <section className="mt-10 border-t border-border pt-6">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="!m-0 !border-0 !p-0 text-base font-semibold">Answer</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer text-sm text-muted hover:text-accent"
        >
          Hide
        </button>
      </div>
      {children}
    </section>
  );
}
