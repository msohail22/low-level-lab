import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

/**
 * Not implemented. The shape is settled, the work is not:
 *
 *   1. write `source` to a temp dir
 *   2. g++ it, outside the sandbox
 *   3. isolate --cg --run, once per test case
 *   4. read isolate's --meta file, diff stdout against the expected output
 *
 * Step 3 is the only security-critical line, and `isolate` is what runs it.
 * Returning 501 rather than a fake result keeps that honest: nothing here
 * grades anything yet.
 */
app.post("/run", (c) =>
  c.json({ error: "not implemented", detail: "isolate is not wired up yet" }, 501),
);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`engine listening on http://localhost:${port}`);
