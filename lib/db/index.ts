import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

/**
 * The Drizzle handle for this request's D1 binding.
 *
 * Built per call rather than once at module scope. On Workers the binding
 * arrives on `env` per isolate, and module-level code is bundled without being
 * executed at build time, so a module-scope handle would capture nothing.
 * Constructing it is a cheap object wrap around the binding, not a connection.
 */
export function getDb() {
  return drizzle((env as unknown as { DB: D1Database }).DB, { schema });
}

export { schema };
