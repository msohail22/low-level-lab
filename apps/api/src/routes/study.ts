import { Hono } from "hono";
import {
  duplicateFlagSchema,
  explanationVoteSchema,
  ingestUiEventsSchema,
} from "@llb/shared";

import { createAuth } from "../auth/index.ts";
import { canReviewQuestions } from "../authz/openfga.ts";
import { requireSession } from "../middleware/session.ts";
import {
  flagDuplicateQuestion,
  getContinueWhereLeftOff,
  getExplanationVoteStats,
  getPlaylistRunner,
  getTopicPrerequisiteGate,
  ingestUiEvents,
  listOpenDuplicateFlags,
  listTopicMastery,
  listWeakTopicDrill,
  resolveDuplicateFlag,
  voteExplanation,
} from "../learn/study.ts";

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

export const studyRoutes = new Hono<AppEnv>();

studyRoutes.use("/continue", requireSession);
studyRoutes.get("/continue", async (c) => {
  const cont = await getContinueWhereLeftOff(c.env, c.get("userId"));
  return c.json({ continue: cont });
});

studyRoutes.get("/mastery", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const topics = await listTopicMastery(c.env, userId);
  return c.json({ topics });
});

studyRoutes.use("/drill/weak", requireSession);
studyRoutes.get("/drill/weak", async (c) => {
  const items = await listWeakTopicDrill(c.env, c.get("userId"));
  return c.json({ items });
});

studyRoutes.get("/topics/:topicId/prerequisite", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const gate = await getTopicPrerequisiteGate(
    c.env,
    c.req.param("topicId"),
    userId,
  );
  return c.json({ gate });
});

studyRoutes.use("/questions/:id/explanation-vote", requireSession);
studyRoutes.post("/questions/:id/explanation-vote", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = explanationVoteSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await voteExplanation(
    c.env,
    c.get("userId"),
    c.req.param("id"),
    parsed.data.helpful,
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true, id: result.id });
});

studyRoutes.get("/questions/:id/explanation-vote", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const votes = await getExplanationVoteStats(
    c.env,
    c.req.param("id"),
    userId,
  );
  return c.json({ votes });
});

studyRoutes.use("/questions/:id/duplicate-flag", requireSession);
studyRoutes.post("/questions/:id/duplicate-flag", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = duplicateFlagSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await flagDuplicateQuestion(
    c.env,
    c.get("userId"),
    c.req.param("id"),
    parsed.data,
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true, id: result.id }, 201);
});

studyRoutes.get("/sets/:id/play", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const play = await getPlaylistRunner(c.env, c.req.param("id"), userId);
  if (!play) return c.json({ error: "Not found" }, 404);
  return c.json({ play });
});

studyRoutes.post("/ui-events", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const body = await c.req.json().catch(() => null);
  const parsed = ingestUiEventsSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await ingestUiEvents(c.env, userId, parsed.data.events);
  return c.json(result, 201);
});

studyRoutes.use("/moderation/duplicates", requireSession);
studyRoutes.get("/moderation/duplicates", async (c) => {
  const allowed = await canReviewQuestions(c.env, c.get("userId"));
  if (!allowed) return c.json({ error: "Forbidden" }, 403);
  const flags = await listOpenDuplicateFlags(c.env);
  return c.json({ flags });
});

studyRoutes.post("/moderation/duplicates/:id/:action", requireSession, async (c) => {
  const allowed = await canReviewQuestions(c.env, c.get("userId"));
  if (!allowed) return c.json({ error: "Forbidden" }, 403);
  const action = c.req.param("action");
  if (action !== "resolve" && action !== "dismiss") {
    return c.json({ error: "Invalid action" }, 400);
  }
  const result = await resolveDuplicateFlag(
    c.env,
    c.req.param("id"),
    action === "resolve" ? "resolved" : "dismissed",
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});
