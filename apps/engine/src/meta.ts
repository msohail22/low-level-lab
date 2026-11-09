/**
 * Parser for isolate's `--meta` file.
 *
 * Format is `key:value`, one per line. Fields are ABSENT on success rather
 * than zero, so every lookup must distinguish missing from falsy. Measured
 * 2026-11-09; server-plan.md §5.9a has the real output.
 */
export type Meta = {
  /** CPU seconds. Overshoots the limit slightly — the kernel charges CPU on a
   *  timer tick, so 1.088 against --time=1 is normal. Never treat as exact. */
  time?: number;
  timeWall?: number;
  maxRssKb?: number;
  cgMemKb?: number;
  exitcode?: number;
  exitsig?: number;
  /** TO timeout, SG signal, RE runtime error, XX internal. Absent on success. */
  status?: string;
  killed: boolean;
  cgOomKilled: boolean;
  message?: string;
};

export function parseMeta(text: string): Meta {
  const kv = new Map<string, string>();
  for (const line of text.split("\n")) {
    const at = line.indexOf(":");
    if (at > 0) kv.set(line.slice(0, at), line.slice(at + 1));
  }
  const num = (k: string) => {
    const v = kv.get(k);
    if (v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    time: num("time"),
    timeWall: num("time-wall"),
    maxRssKb: num("max-rss"),
    cgMemKb: num("cg-mem"),
    exitcode: num("exitcode"),
    exitsig: num("exitsig"),
    status: kv.get("status"),
    killed: kv.get("killed") === "1",
    cgOomKilled: kv.get("cg-oom-killed") === "1",
    message: kv.get("message"),
  };
}

/**
 * Compare a program's stdout against the expected output.
 *
 * Trailing whitespace on each line and at the end of the file is ignored, and
 * nothing else is. A judge that ignored more would accept wrong answers; one
 * that ignored less would fail a correct program over a missing final newline,
 * which no reader would understand.
 */
export function outputMatches(got: string, want: string): boolean {
  const norm = (t: string) =>
    t.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
  return norm(got) === norm(want);
}
