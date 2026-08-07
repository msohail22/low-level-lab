import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { createDb } from "../db/index.ts";
import type { Hyperdrive } from "@cloudflare/workers-types";

export const health = new Hono<{ Bindings: { HYPERDRIVE: Hyperdrive } }>();

health.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

health.get("/db", async (c) => {
  const db = createDb(c.env.HYPERDRIVE);
  try {
    await db.execute(sql`SELECT 1`);

    return c.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error(error);

    return c.json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
