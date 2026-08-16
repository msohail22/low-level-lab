import { Hono } from "hono";
import { createReactorClient, ReactorError } from "@llb/reactor-sdk";
import { z } from "zod";

import {
  requireSession,
  type AppVariables,
} from "../middleware/session.ts";

type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: AppVariables;
};

const submitSchema = z.object({
  language: z.literal("cpp"),
  source: z.string().min(1).max(200_000),
});

function reactorClient(env: CloudflareBindings) {
  const baseUrl = env.REACTOR_URL || "http://127.0.0.1:18080";
  return createReactorClient({ baseUrl });
}

export const reactorRoutes = new Hono<AppEnv>();

reactorRoutes.use("*", requireSession);

reactorRoutes.post("/jobs", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "INVALID_BODY", details: parsed.error.flatten() }, 400);
  }

  try {
    const client = reactorClient(c.env);
    const job = await client.submitJob(parsed.data);
    return c.json(job, 201);
  } catch (err) {
    if (err instanceof ReactorError) {
      if (err.status === 0 || err.status >= 500 || err.message.includes("fetch")) {
        return c.json({ error: "REACTOR_UNAVAILABLE" }, 503);
      }
      return c.json({ error: err.message, details: err.body }, err.status as 400);
    }
    const message = err instanceof Error ? err.message : String(err);
    if (/fetch|ECONNREFUSED|network/i.test(message)) {
      return c.json({ error: "REACTOR_UNAVAILABLE" }, 503);
    }
    console.error("[reactor proxy]", err);
    return c.json({ error: "REACTOR_UNAVAILABLE" }, 503);
  }
});

reactorRoutes.get("/jobs/:id", async (c) => {
  try {
    const client = reactorClient(c.env);
    const job = await client.getJob(c.req.param("id"));
    return c.json(job);
  } catch (err) {
    if (err instanceof ReactorError) {
      if (err.status === 404) return c.json({ error: "NOT_FOUND" }, 404);
      if (err.status >= 500) return c.json({ error: "REACTOR_UNAVAILABLE" }, 503);
      return c.json({ error: err.message, details: err.body }, 400);
    }
    const message = err instanceof Error ? err.message : String(err);
    if (/fetch|ECONNREFUSED|network/i.test(message)) {
      return c.json({ error: "REACTOR_UNAVAILABLE" }, 503);
    }
    console.error("[reactor proxy]", err);
    return c.json({ error: "REACTOR_UNAVAILABLE" }, 503);
  }
});
