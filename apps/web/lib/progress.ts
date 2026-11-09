import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { progress } from "./db/schema";

/** The key a question is stored under: "<topic>/<slug>". */
export function questionKey(topic: string, slug: string) {
  return `${topic}/${slug}`;
}

/**
 * Every question this user has solved, as a Set of "<topic>/<slug>".
 *
 * One query for the whole set rather than one per question: the primary key is
 * (user_id, kind, key), so this is a prefix scan of the user's own rows and
 * the list page can then mark every row without touching the database again.
 */
export async function solvedKeys(userId: string): Promise<Set<string>> {
  const rows = await getDb()
    .select({ key: progress.key })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.kind, "solved")));

  return new Set(rows.map((row) => row.key));
}

/**
 * Mark a question solved. Safe to call twice — the primary key collides and
 * the row is left as it was, so a double click does not move the timestamp.
 */
export async function markSolved(userId: string, topic: string, slug: string) {
  await getDb()
    .insert(progress)
    .values({
      userId,
      kind: "solved",
      key: questionKey(topic, slug),
      value: null,
      at: Math.floor(Date.now() / 1000),
    })
    .onConflictDoNothing();
}

/** Undo markSolved. */
export async function unmarkSolved(userId: string, topic: string, slug: string) {
  await getDb()
    .delete(progress)
    .where(
      and(
        eq(progress.userId, userId),
        eq(progress.kind, "solved"),
        eq(progress.key, questionKey(topic, slug)),
      ),
    );
}

/**
 * How many distinct readers solved a question. Served by progress_by_key,
 * which exists for exactly this direction of the lookup.
 */
export async function solvedCount(topic: string, slug: string): Promise<number> {
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)` })
    .from(progress)
    .where(and(eq(progress.kind, "solved"), eq(progress.key, questionKey(topic, slug))));

  return row?.n ?? 0;
}
