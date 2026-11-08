"use client";

import { useState, type ReactNode } from "react";

export function Solution({
  language,
  children,
}: {
  language?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="my-8 rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <h2 className="!m-0 !border-0 !p-0 text-base font-semibold">
            Accepted solution
          </h2>
          <p className="!m-0 text-xs text-muted">
            {language ? `${language} · ` : ""}try it yourself first
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent"
        >
          {open ? "Hide" : "Reveal"}
        </button>
      </header>
      {open ? <div className="border-t border-border px-4 pb-1">{children}</div> : null}
    </section>
  );
}
