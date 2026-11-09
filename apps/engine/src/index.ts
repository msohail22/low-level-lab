import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { rm } from "node:fs/promises";
import { HOST, ISOLATE_BIN, LIMITS, MAX_CONCURRENT, PORT } from "./config.ts";
import { compile, runCase, type CaseResult } from "./isolate.ts";
import { runRequestSchema } from "./schema.ts";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.get("/config", (c) =>
  c.json({ isolateBin: ISOLATE_BIN, limits: LIMITS, concurrency: MAX_CONCURRENT }),
);

/**
 * Compile one C++ submission and run it against every test case.
 *
 * 200 is returned even when every case fails. A failing submission is a
 * successful request: the caller asked "does this pass", and "no" is an
 * answer. Non-2xx is reserved for the engine being unable to answer at all.
 */
app.post("/run", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = runRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "bad request", issues: parsed.error.issues }, 400);
  }
  const { source, tests } = parsed.data;

  const built = await compile(source);
  if (!built.ok) {
    // A compile error is the reader's mistake, not a server fault, so it is a
    // normal 200 result with a verdict the UI can show.
    return c.json({ verdict: "compile-error", compileStderr: built.stderr, results: [] });
  }

  try {
    // Sequential on purpose for now. runCase already serialises on the box-id
    // queue, so parallelism here would only queue inside isolate while making
    // the timings noisier — and server-plan.md §10.2 says the concurrent
    // figure must be measured before it is raised.
    const results: CaseResult[] = [];
    for (const [i, t] of tests.entries()) results.push(await runCase(built.binary, t, i));

    const passed = results.filter((r) => r.status === "ok").length;
    return c.json({
      verdict: passed === results.length ? "accepted" : "rejected",
      passed,
      total: results.length,
      // The first failure is what a reader acts on. Naming it saves the UI
      // from scanning the array to find the same thing.
      firstFailure: results.find((r) => r.status !== "ok")?.index ?? null,
      results,
    });
  } finally {
    await rm(built.dir, { recursive: true, force: true }).catch(() => {});
  }
});

serve({ fetch: app.fetch, hostname: HOST, port: PORT });
console.log(`engine listening on http://${HOST}:${PORT}`);
