import { Hono } from "hono";
import { z } from "zod";

import { requireSession } from "../middleware/session.ts";
import {
  addBookmark,
  getLearningStats,
  getPathDetail,
  listBookmarks,
  listDueReviews,
  listMistakes,
  listPaths,
  removeBookmark,
  updateDailyGoal,
  isBookmarked,
} from "../learn/engagement.ts";
import { createAuth } from "../auth/index.ts";

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

export const engagementRoutes = new Hono<AppEnv>();

engagementRoutes.get("/paths", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const paths = await listPaths(c.env, userId);
  return c.json({ paths });
});

engagementRoutes.get("/paths/:id", async (c) => {
  const userId = await optionalUserId(c.env, c.req.raw.headers);
  const path = await getPathDetail(c.env, c.req.param("id"), userId);
  if (!path) return c.json({ error: "Not found" }, 404);
  return c.json({ path });
});

engagementRoutes.use("/stats", requireSession);
engagementRoutes.get("/stats", async (c) => {
  const stats = await getLearningStats(c.env, c.get("userId"));
  return c.json({ stats });
});

engagementRoutes.use("/stats/goal", requireSession);
engagementRoutes.patch("/stats/goal", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({ dailyGoal: z.number().int().min(1).max(50) })
    .safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const stats = await updateDailyGoal(
    c.env,
    c.get("userId"),
    parsed.data.dailyGoal,
  );
  return c.json({ stats });
});

engagementRoutes.use("/due", requireSession);
engagementRoutes.get("/due", async (c) => {
  const items = await listDueReviews(c.env, c.get("userId"));
  return c.json({ items });
});

engagementRoutes.use("/mistakes", requireSession);
engagementRoutes.get("/mistakes", async (c) => {
  const items = await listMistakes(c.env, c.get("userId"));
  return c.json({ items });
});

engagementRoutes.use("/bookmarks/*", requireSession);
engagementRoutes.use("/bookmarks", requireSession);
engagementRoutes.get("/bookmarks", async (c) => {
  const items = await listBookmarks(c.env, c.get("userId"));
  return c.json({ items });
});

engagementRoutes.post("/bookmarks", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z.object({ questionId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid body" }, 400);
  const result = await addBookmark(
    c.env,
    c.get("userId"),
    parsed.data.questionId,
  );
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true, id: result.id }, 201);
});

engagementRoutes.delete("/bookmarks/:questionId", async (c) => {
  await removeBookmark(c.env, c.get("userId"), c.req.param("questionId"));
  return c.json({ ok: true });
});

engagementRoutes.get("/bookmarks/:questionId/status", async (c) => {
  const bookmarked = await isBookmarked(
    c.env,
    c.get("userId"),
    c.req.param("questionId"),
  );
  return c.json({ bookmarked });
});
