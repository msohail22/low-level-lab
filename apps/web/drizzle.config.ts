import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit only. The Worker never reads this file: at runtime the database
 * arrives as the DB binding, so no account id, database id or token is needed
 * there — or here, because this config is used for `generate` alone.
 *
 * `out` is "./migrations" because that is where wrangler looks by default, so
 * the generated SQL is applied with `wrangler d1 migrations apply` and the
 * same files run locally and in production.
 */
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
});
