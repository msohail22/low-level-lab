import { z } from "zod";

/**
 * A single test case, the same shape as a line of
 * `apps/web/content/<topic>/<slug>.tests.jsonl`. Kept identical on purpose:
 * the file is written by the site and read here, and two spellings of one
 * contract is how they drift.
 */
export const testCaseSchema = z.object({
  in: z.string(),
  out: z.string(),
  note: z.string().optional(),
});

export const runRequestSchema = z.object({
  /** C++ source. Capped so a request cannot be used to exhaust memory before
   *  any sandbox is involved. 256 KB is far more than any answer needs. */
  source: z.string().min(1).max(256 * 1024),
  /** Cases are sent by the caller rather than fetched here. The engine has no
   *  copy of the content and must not grow one: the site already serves the
   *  cases as static assets, and a second source of truth would go stale. */
  tests: z.array(testCaseSchema).min(1).max(200),
});

export type TestCase = z.infer<typeof testCaseSchema>;
export type RunRequest = z.infer<typeof runRequestSchema>;

/** Why a case did not pass. `ok` means it did. */
export type CaseStatus =
  | "ok"
  | "wrong"   // ran cleanly, output differs
  | "timeout" // isolate status TO
  | "oom"     // cgroup memory limit fired
  | "crashed" // killed by a signal, or non-zero exit
  | "error";  // isolate itself failed
