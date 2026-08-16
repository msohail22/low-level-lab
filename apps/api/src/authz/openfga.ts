import { OpenFgaClient, CredentialsMethod } from "@openfga/sdk";

export const PLATFORM_ID = "llb";

function hasOpenFga(env: CloudflareBindings): boolean {
  return Boolean(env.OPENFGA_API_URL && env.OPENFGA_STORE_ID);
}

function createClient(env: CloudflareBindings): OpenFgaClient | null {
  if (!hasOpenFga(env)) return null;

  return new OpenFgaClient({
    apiUrl: env.OPENFGA_API_URL,
    storeId: env.OPENFGA_STORE_ID,
    authorizationModelId: env.OPENFGA_MODEL_ID || undefined,
    ...(env.OPENFGA_API_TOKEN
      ? {
          credentials: {
            method: CredentialsMethod.ApiToken,
            config: { token: env.OPENFGA_API_TOKEN },
          },
        }
      : {}),
  });
}

function reviewerFallbackIds(env: CloudflareBindings): Set<string> {
  return new Set(
    (env.REVIEWER_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

function adminFallbackIds(env: CloudflareBindings): Set<string> {
  return new Set(
    (env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export async function ensurePlatformMember(
  env: CloudflareBindings,
  userId: string,
): Promise<void> {
  const client = createClient(env);
  if (!client) return;

  try {
    await client.writeTuples([
      {
        user: `user:${userId}`,
        relation: "member",
        object: `platform:${PLATFORM_ID}`,
      },
    ]);
  } catch (err) {
    console.error("openfga ensurePlatformMember", err);
  }
}

export async function writeQuestionAuthor(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
): Promise<void> {
  const client = createClient(env);
  if (!client) return;

  try {
    await client.writeTuples([
      {
        user: `user:${userId}`,
        relation: "author",
        object: `question:${questionId}`,
      },
      {
        user: `platform:${PLATFORM_ID}`,
        relation: "platform",
        object: `question:${questionId}`,
      },
    ]);
  } catch (err) {
    console.error("openfga writeQuestionAuthor", err);
  }
}

export async function canReviewQuestions(
  env: CloudflareBindings,
  userId: string,
): Promise<boolean> {
  if (await canAdminPlatform(env, userId)) return true;

  const client = createClient(env);
  if (!client) {
    return reviewerFallbackIds(env).has(userId);
  }

  try {
    const { allowed } = await client.check({
      user: `user:${userId}`,
      relation: "reviewer",
      object: `platform:${PLATFORM_ID}`,
    });
    return Boolean(allowed);
  } catch (err) {
    console.error("openfga canReviewQuestions", err);
    return reviewerFallbackIds(env).has(userId);
  }
}

export async function canAdminPlatform(
  env: CloudflareBindings,
  userId: string,
): Promise<boolean> {
  const client = createClient(env);
  if (!client) {
    return adminFallbackIds(env).has(userId);
  }

  try {
    const { allowed } = await client.check({
      user: `user:${userId}`,
      relation: "admin",
      object: `platform:${PLATFORM_ID}`,
    });
    return Boolean(allowed);
  } catch (err) {
    console.error("openfga canAdminPlatform", err);
    return adminFallbackIds(env).has(userId);
  }
}

export async function getUserRoles(env: CloudflareBindings, userId: string) {
  const [reviewer, admin] = await Promise.all([
    canReviewQuestions(env, userId),
    canAdminPlatform(env, userId),
  ]);
  return { reviewer, admin };
}

export async function grantReviewer(
  env: CloudflareBindings,
  userId: string,
): Promise<{ ok: boolean; mode: "openfga" | "fallback_hint" }> {
  const client = createClient(env);
  if (!client) {
    return { ok: false, mode: "fallback_hint" };
  }

  await client.writeTuples([
    {
      user: `user:${userId}`,
      relation: "reviewer",
      object: `platform:${PLATFORM_ID}`,
    },
  ]);
  return { ok: true, mode: "openfga" };
}
