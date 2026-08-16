import { Hono } from "hono";
import { z } from "zod";

import { createAuth } from "../auth/index.ts";
import { canReviewQuestions } from "../authz/openfga.ts";
import { requireSession } from "../middleware/session.ts";
import {
  addSetItem,
  createComment,
  createQuestionSet,
  followAuthor,
  getAuthorReputation,
  getDailyChallengeLeaderboard,
  getGlossaryTerm,
  getHintCount,
  getOrCreateDailyChallenge,
  getQuestionVersion,
  getSetDetail,
  isFollowingAuthor,
  listAchievements,
  listApprovedComments,
  listFollowingFeed,
  listGlossary,
  listOpenReports,
  listPendingComments,
  listPublicSets,
  listQuestionVersions,
  reportQuestion,
  resolveReport,
  revealHint,
  reviewComment,
  suggestNextQuestion,
  submitSandbox,
  unfollowAuthor,
} from "../learn/platform.ts";

type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: {
    userId: string;
    userEmail: string;
    userName: string;
  };
};

async function optionalUserId(env: CloudflareBindings, headers: Headers) {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers });
  return session?.user?.id;
}

export const platformRoutes = new Hono<AppEnv>();

platformRoutes.get("/challenge/today", async (c) => {
  const challenge = await getOrCreateDailyChallenge(c.env);
  if (!challenge) return c.json({ challenge: null });
  return c.json({ challenge });
});

platformRoutes.get("/challenge/leaderboard", async (c) => {
  const data = await getDailyChallengeLeaderboard(c.env);
  return c.json(data);
});

platformRoutes.get("/achievements", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const achievements = await listAchievements(c.env, userId);
  return c.json({ achievements });
});

platformRoutes.get("/glossary", async (c) => {
  const terms = await listGlossary(c.env, c.req.query("topicId") || undefined);
  return c.json({ terms });
});

platformRoutes.get("/glossary/:slug", async (c) => {
  const term = await getGlossaryTerm(c.env, c.req.param("slug"));
  if (!term) return c.json({ error: "Not found" }, 404);
  return c.json({ term });
});

platformRoutes.get("/sets", async (c) => {
  const sets = await listPublicSets(c.env);
  return c.json({ sets });
});

platformRoutes.get("/sets/:id", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const set = await getSetDetail(c.env, c.req.param("id"), userId);
  if (!set) return c.json({ error: "Not found" }, 404);
  return c.json({ set });
});

platformRoutes.post("/sets", requireSession, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({
      title: z.string().min(3).max(200),
      description: z.string().max(2000).optional(),
      isPublic: z.boolean().optional(),
      questionIds: z.array(z.string().min(1)).max(100).optional(),
    })
    .safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const created = await createQuestionSet(c.env, c.get("userId"), parsed.data);
  return c.json(created, 201);
});

platformRoutes.post("/sets/:id/items", requireSession, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z.object({ questionId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await addSetItem(
    c.env,
    c.get("userId"),
    c.req.param("id"),
    parsed.data.questionId,
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  if (result.error === "FORBIDDEN") return c.json({ error: "Forbidden" }, 403);
  if (result.error === "QUESTION_NOT_FOUND") {
    return c.json({ error: "Question not found" }, 404);
  }
  return c.json({ ok: true, id: result.id }, 201);
});

platformRoutes.get("/authors/:id/reputation", async (c) => {
  const reputation = await getAuthorReputation(c.env, c.req.param("id"));
  if (!reputation) return c.json({ error: "Not found" }, 404);
  return c.json({ reputation });
});

platformRoutes.get("/authors/:id/follow/status", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  if (!userId) return c.json({ following: false });
  const following = await isFollowingAuthor(c.env, userId, c.req.param("id"));
  return c.json({ following });
});

platformRoutes.post("/authors/:id/follow", requireSession, async (c) => {
  const result = await followAuthor(c.env, c.get("userId"), c.req.param("id"));
  if (result.error === "SELF") return c.json({ error: "Cannot follow yourself" }, 400);
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true, id: result.id }, 201);
});

platformRoutes.delete("/authors/:id/follow", requireSession, async (c) => {
  await unfollowAuthor(c.env, c.get("userId"), c.req.param("id"));
  return c.json({ ok: true });
});

platformRoutes.use("/feed", requireSession);
platformRoutes.get("/feed", async (c) => {
  const items = await listFollowingFeed(c.env, c.get("userId"));
  return c.json({ items });
});

platformRoutes.get("/questions/:id/comments", async (c) => {
  const comments = await listApprovedComments(c.env, c.req.param("id"));
  return c.json({ comments });
});

platformRoutes.post("/questions/:id/comments", requireSession, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({ body: z.string().min(2).max(2000) })
    .safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await createComment(
    c.env,
    c.get("userId"),
    c.req.param("id"),
    parsed.data.body,
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true, id: result.id, status: "pending" }, 201);
});

platformRoutes.get("/questions/:id/hints/:index", requireSession, async (c) => {
  const index = Number(c.req.param("index"));
  if (!Number.isInteger(index) || index < 0) {
    return c.json({ error: "Invalid index" }, 400);
  }
  const result = await revealHint(c.env, c.req.param("id"), index);
  if (result.error === "NONE") return c.json({ error: "No hints" }, 404);
  if (result.error === "OUT_OF_RANGE") {
    return c.json(
      { error: "No more hints", hintCount: result.hintCount },
      400,
    );
  }
  return c.json(result);
});

platformRoutes.get("/questions/:id/hints", async (c) => {
  const hintCount = await getHintCount(c.env, c.req.param("id"));
  return c.json({ hintCount });
});

platformRoutes.get("/questions/:id/next", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const next = await suggestNextQuestion(c.env, c.req.param("id"), userId);
  return c.json({ next });
});

platformRoutes.post("/questions/:id/sandbox", requireSession, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({
      sourceCode: z.string().max(20000).optional(),
      submittedOutput: z.string().max(4000).optional(),
    })
    .safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await submitSandbox(
    c.env,
    c.get("userId"),
    c.req.param("id"),
    parsed.data,
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json(result.result, 201);
});

platformRoutes.post("/questions/:id/report", requireSession, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({
      reason: z.string().min(3).max(200),
      details: z.string().max(2000).optional(),
    })
    .safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await reportQuestion(
    c.env,
    c.get("userId"),
    c.req.param("id"),
    parsed.data.reason,
    parsed.data.details,
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true, id: result.id }, 201);
});

platformRoutes.get("/questions/:id/versions", async (c) => {
  const versions = await listQuestionVersions(c.env, c.req.param("id"));
  return c.json({ versions });
});

platformRoutes.get("/questions/:id/versions/:version", async (c) => {
  const version = Number(c.req.param("version"));
  if (!Number.isInteger(version) || version < 1) {
    return c.json({ error: "Invalid version" }, 400);
  }
  const row = await getQuestionVersion(c.env, c.req.param("id"), version);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ version: row });
});

platformRoutes.use("/moderation/*", requireSession);
platformRoutes.get("/moderation/comments", async (c) => {
  const allowed = await canReviewQuestions(c.env, c.get("userId"));
  if (!allowed) return c.json({ error: "Forbidden" }, 403);
  const comments = await listPendingComments(c.env);
  return c.json({ comments });
});

platformRoutes.post("/moderation/comments/:id/:action", async (c) => {
  const allowed = await canReviewQuestions(c.env, c.get("userId"));
  if (!allowed) return c.json({ error: "Forbidden" }, 403);
  const action = c.req.param("action");
  if (action !== "approve" && action !== "reject") {
    return c.json({ error: "Invalid action" }, 400);
  }
  const result = await reviewComment(c.env, c.req.param("id"), action);
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  if (result.error === "INVALID_STATUS") {
    return c.json({ error: "Invalid status" }, 400);
  }
  return c.json({ ok: true });
});

platformRoutes.get("/moderation/reports", async (c) => {
  const allowed = await canReviewQuestions(c.env, c.get("userId"));
  if (!allowed) return c.json({ error: "Forbidden" }, 403);
  const reports = await listOpenReports(c.env);
  return c.json({ reports });
});

platformRoutes.post("/moderation/reports/:id/:action", async (c) => {
  const allowed = await canReviewQuestions(c.env, c.get("userId"));
  if (!allowed) return c.json({ error: "Forbidden" }, 403);
  const action = c.req.param("action");
  if (action !== "resolve" && action !== "dismiss") {
    return c.json({ error: "Invalid action" }, 400);
  }
  const result = await resolveReport(
    c.env,
    c.req.param("id"),
    action === "resolve" ? "resolved" : "dismissed",
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});
