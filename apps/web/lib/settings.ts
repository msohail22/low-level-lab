import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { progress } from "./db/schema";
import { clearCache, readCache, writeCache } from "./prefs-cache";
import { isValid, normalise, type Prefs, type SettingKey } from "./settings-shared";

/**
 * Reader settings: the part that talks to D1 and KV.
 *
 * D1 is the source of truth — one `kind = 'setting'` row per setting, the
 * shape `lib/db/schema.ts` already defines, so a setting follows the reader to
 * another browser. KV caches the read and a cookie mirrors the values for the
 * server render; neither is ever trusted over the rows.
 *
 * Everything in ./settings-shared is re-exported, so a server module imports
 * "@/lib/settings" and gets both halves. A client module must import
 * "@/lib/settings-shared" instead — importing this one would drag
 * `cloudflare:workers` into the browser bundle and fail the build.
 */
export * from "./settings-shared";

/* --- D1 ------------------------------------------------------------------ */

/**
 * Every setting this user has saved, defaults filled in.
 *
 * KV first, D1 on a miss. The miss also fills the cache, so a reader pays the
 * database read once rather than on every page that needs their settings.
 */
export async function loadPrefs(userId: string): Promise<Prefs> {
  const cached = await readCache(userId);
  // Normalised even on a hit: a value written by an older deploy may no
  // longer be an option this one declares.
  if (cached) return normalise(cached);

  const prefs = await loadPrefsFromDb(userId);
  await writeCache(userId, prefs);
  return prefs;
}

/** The uncached read. The cache is built from this, never the other way. */
async function loadPrefsFromDb(userId: string): Promise<Prefs> {
  const rows = await getDb()
    .select({ key: progress.key, value: progress.value })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.kind, "setting")));

  return normalise(Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""])));
}

/**
 * Write several settings and return the stored result.
 *
 * One call rather than one per setting, because each write has to refresh the
 * KV entry: three separate writes would mean three refreshes and three reads
 * to build them. The rows go in a D1 batch — one round trip — and the cache is
 * rebuilt once, from the database, so it can only ever hold what D1 holds.
 *
 * An upsert, not an insert: the primary key is (user_id, kind, key), so
 * changing the theme twice updates the one row rather than failing or growing
 * a history. Unknown keys and values are dropped, not stored.
 */
export async function savePrefs(
  userId: string,
  changes: Partial<Record<string, string>>,
): Promise<Prefs> {
  const at = Math.floor(Date.now() / 1000);

  const writes = Object.entries(changes)
    .filter(
      (entry): entry is [SettingKey, string] =>
        typeof entry[1] === "string" && isValid(entry[0], entry[1]),
    )
    .map(([key, value]) =>
      getDb()
        .insert(progress)
        .values({ userId, kind: "setting" as const, key, value, at })
        .onConflictDoUpdate({
          target: [progress.userId, progress.kind, progress.key],
          set: { value, at },
        }),
    );

  if (writes.length === 0) return loadPrefs(userId);

  // drizzle's batch takes a non-empty tuple, which the length check above
  // proves but the type cannot.
  await getDb().batch(writes as unknown as [(typeof writes)[number]]);

  const prefs = await loadPrefsFromDb(userId);
  await writeCache(userId, prefs);
  return prefs;
}

/**
 * Delete everything this site stores about a reader: settings and solved
 * marks. It does not delete the WorkOS account, which the site does not own.
 */
export async function forgetUser(userId: string) {
  await getDb().delete(progress).where(eq(progress.userId, userId));
  await clearCache(userId);
}
