import { env } from "cloudflare:workers";

/**
 * Copies the Worker's secret bindings into `process.env`.
 *
 * Why this exists: `@workos-inc/authkit-nextjs` reads its configuration from
 * `process.env`. On workerd there is no process environment — vinext leaves
 * `process.env` empty and inlines only `NEXT_PUBLIC_*` at build time, so the
 * library finds nothing and throws "You must provide a valid cookie password".
 *
 * Secrets on Workers arrive per-isolate on the `env` binding instead. Calling
 * this before any authkit entry point bridges the two. It is cheap and
 * idempotent, so every entry point calls it rather than relying on import
 * order.
 *
 * Measured: without this, `Object.keys(process.env).length === 0` at runtime.
 */
const KEYS = ["WORKOS_CLIENT_ID", "WORKOS_API_KEY", "WORKOS_COOKIE_PASSWORD"] as const;

let done = false;

export function syncWorkosEnv() {
  if (done) return;

  const source = env as unknown as Record<string, unknown>;
  for (const key of KEYS) {
    const value = source[key];
    if (typeof value === "string" && value !== "") process.env[key] = value;
  }

  done = true;
}
