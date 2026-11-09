import { env } from "cloudflare:workers";

/**
 * The KV read cache for a reader's settings.
 *
 * D1 is the source of truth. KV holds the same values so a page that needs
 * them does not have to query the database. Three rules keep it honest:
 *
 * 1. Every write to D1 writes here too, so the cache is never behind.
 * 2. A miss is not an error — it is a slower correct answer from D1.
 * 3. A failure here is swallowed. The cache must never be able to break a
 *    page that D1 could have served.
 *
 * It is a per-user key, not one big object, so one reader's write cannot
 * clobber another's.
 */

/** A day. The entry is refreshed on every write, so this is only a floor. */
const TTL_SECONDS = 60 * 60 * 24;

function namespace(): KVNamespace | null {
  const binding = (env as unknown as { PREFS?: KVNamespace }).PREFS;
  return binding ?? null;
}

function cacheKey(userId: string) {
  return `prefs:${userId}`;
}

/** The cached record, or null on a miss, a parse failure, or no binding. */
export async function readCache(
  userId: string,
): Promise<Record<string, string> | null> {
  const kv = namespace();
  if (!kv) return null;

  try {
    // "json" so KV parses it; a corrupt entry returns null rather than throws.
    return await kv.get<Record<string, string>>(cacheKey(userId), "json");
  } catch {
    return null;
  }
}

/** Write-through. Failure is ignored: D1 already has the truth. */
export async function writeCache(userId: string, prefs: Record<string, string>) {
  const kv = namespace();
  if (!kv) return;

  try {
    await kv.put(cacheKey(userId), JSON.stringify(prefs), {
      expirationTtl: TTL_SECONDS,
    });
  } catch {
    // ignored on purpose
  }
}

/** Drops the entry, for when the rows behind it are deleted. */
export async function clearCache(userId: string) {
  const kv = namespace();
  if (!kv) return;

  try {
    await kv.delete(cacheKey(userId));
  } catch {
    // ignored on purpose
  }
}
