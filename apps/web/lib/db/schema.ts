import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Progress and settings for a signed-in reader.
 *
 * There is no users table on purpose. WorkOS stores identity — email, name,
 * which GitHub or Google account — and the session cookie carries it, so a
 * profile page renders with no database read. A local users table would be a
 * cache that goes stale. D1 holds only what WorkOS does not have.
 *
 * One row per fact, never a JSON blob per user. Marking a question solved is
 * then a single INSERT that cannot lose a concurrent write from another tab,
 * and the primary key makes clicking twice harmless.
 */
export const progress = sqliteTable(
  "progress",
  {
    /**
     * The WorkOS user id, e.g. "user_01HQ3...". Not an email: an email can
     * change, and the id cannot.
     */
    userId: text("user_id").notNull(),

    /**
     * 'solved'  — key is "<topic>/<slug>", value is NULL
     * 'setting' — key is the setting name, value is the setting value
     */
    kind: text("kind", { enum: ["solved", "setting"] }).notNull(),

    key: text("key").notNull(),
    value: text("value"),

    /** Unix seconds. When it was solved, or when the setting last changed. */
    at: integer("at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.kind, table.key] }),

    /**
     * The primary key already serves "everything for this user", which is what
     * every page needs. This index serves the other direction: how many people
     * solved a given question, for a future ranking job. Without it that is a
     * full table scan.
     */
    index("progress_by_key").on(table.kind, table.key),

    /**
     * The enum above is a TypeScript type only; it emits no SQL. This keeps the
     * constraint the hand-written migration had, so a bad write fails in the
     * database rather than silently landing.
     */
    check("progress_kind", sql`${table.kind} in ('solved', 'setting')`),
  ],
);

export type ProgressRow = typeof progress.$inferSelect;
