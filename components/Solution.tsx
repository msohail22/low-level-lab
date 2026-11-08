"use client";

import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function Solution({
  language,
  children,
}: {
  language?: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      heading="Accepted solution"
      note={`${language ? `${language} · ` : ""}try it yourself first`}
    >
      {children}
    </Reveal>
  );
}

export function Answer({ children }: { children: ReactNode }) {
  return (
    <Reveal heading="Answer" note="work it out before you open this">
      {children}
    </Reveal>
  );
}
