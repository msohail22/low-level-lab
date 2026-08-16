/**
 * Redis Hot Cache Layer (Upstash REST API / Cloudflare Workers friendly)
 *
 * Supports caching question lists and user session data.
 * Gracefully falls back to null on cache miss or when Redis is not configured.
 */

function getUpstashConfig(env: CloudflareBindings): {
  url: string;
  token: string;
} | null {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export async function getCache<T>(
  env: CloudflareBindings,
  key: string,
): Promise<T | null> {
  const config = getUpstashConfig(env);
  if (!config) return null;

  try {
    const res = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { result?: string | null };
    if (!json.result) return null;

    return JSON.parse(json.result) as T;
  } catch (err) {
    console.error(`[RedisCache] GET ${key} failed:`, err);
    return null;
  }
}

export async function setCache<T>(
  env: CloudflareBindings,
  key: string,
  data: T,
  ttlSeconds = 900, // 15 min default
): Promise<void> {
  const config = getUpstashConfig(env);
  if (!config) return;

  try {
    const valueStr = JSON.stringify(data);
    await fetch(
      `${config.url}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(valueStr),
      },
    );
  } catch (err) {
    console.error(`[RedisCache] SET ${key} failed:`, err);
  }
}

export async function deleteCache(
  env: CloudflareBindings,
  key: string,
): Promise<void> {
  const config = getUpstashConfig(env);
  if (!config) return;

  try {
    await fetch(`${config.url}/del/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });
  } catch (err) {
    console.error(`[RedisCache] DEL ${key} failed:`, err);
  }
}

export async function deleteCachePrefix(
  env: CloudflareBindings,
  prefix: string,
): Promise<void> {
  const config = getUpstashConfig(env);
  if (!config) return;

  try {
    const keysRes = await fetch(
      `${config.url}/keys/${encodeURIComponent(prefix)}*`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      },
    );
    if (!keysRes.ok) return;

    const keysJson = (await keysRes.json()) as { result?: string[] };
    const keys = keysJson.result;
    if (!keys || keys.length === 0) return;

    for (const key of keys) {
      await deleteCache(env, key);
    }
  } catch (err) {
    console.error(`[RedisCache] DEL prefix ${prefix} failed:`, err);
  }
}

/**
 * Question cache invalidation
 */
export async function invalidateQuestionCache(
  env: CloudflareBindings,
  topicId?: string,
): Promise<void> {
  await deleteCache(env, "questions:approved:all");
  if (topicId) {
    await deleteCache(env, `questions:approved:topic:${topicId}`);
  } else {
    await deleteCachePrefix(env, "questions:approved:topic:");
  }
}

/**
 * User session profile cache invalidation
 */
export async function invalidateUserCache(
  env: CloudflareBindings,
  userId: string,
): Promise<void> {
  await deleteCachePrefix(env, `user:${userId}:`);
}
