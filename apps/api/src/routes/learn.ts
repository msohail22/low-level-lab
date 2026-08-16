import { Hono } from "hono";

import { createAuth } from "../auth/index.ts";
import { requireSession } from "../middleware/session.ts";
import { submitAttemptSchema } from "../learn/schema.ts";
import {
  getLeaderboard,
  getMyAttempt,
  getPracticeQuestion,
  listApprovedQuestionsForTopic,
  listLearnTopics,
  submitAttempt,
} from "../learn/service.ts";

type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: {
    userId: string;
    userEmail: string;
    userName: string;
  };
};

async function optionalUserId(
  env: CloudflareBindings,
  headers: Headers,
): Promise<string | undefined> {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers });
  return session?.user?.id;
}

export const learnRoutes = new Hono<AppEnv>();

learnRoutes.get("/topics", async (c) => {
  const topics = await listLearnTopics(c.env);
  return c.json({ topics });
});

learnRoutes.get("/topics/:topicId/questions", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const attemptedRaw = c.req.query("attempted");
  const attempted =
    attemptedRaw === "yes" || attemptedRaw === "no" || attemptedRaw === "all"
      ? attemptedRaw
      : "all";
  const questions = await listApprovedQuestionsForTopic(
    c.env,
    c.req.param("topicId"),
    userId,
    {
      type: c.req.query("type") || undefined,
      difficulty: c.req.query("difficulty") || undefined,
      attempted,
    },
  );
  return c.json({ questions });
});

learnRoutes.get("/questions/:id", async (c) => {
  const practice = await getPracticeQuestion(c.env, c.req.param("id"));
  if (!practice) return c.json({ error: "Not found" }, 404);

  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const prior = userId
    ? await getMyAttempt(c.env, userId, c.req.param("id"))
    : null;

  return c.json({ question: practice, attempt: prior });
});

learnRoutes.use("/questions/:id/attempt", requireSession);
learnRoutes.post("/questions/:id/attempt", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = submitAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const result = await submitAttempt(
    c.env,
    c.get("userId"),
    c.req.param("id"),
    parsed.data,
  );

  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  if (result.error === "ALREADY_ATTEMPTED") {
    return c.json({ error: "Already attempted" }, 409);
  }

  return c.json(result.result, 201);
});

export const leaderboardRoutes = new Hono<AppEnv>();

leaderboardRoutes.get("/", async (c) => {
  const entries = await getLeaderboard(c.env);
  return c.json({ leaderboard: entries });
});
