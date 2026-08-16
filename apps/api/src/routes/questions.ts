import { Hono } from "hono";

import {
  canReviewQuestions,
  ensurePlatformMember,
  writeQuestionAuthor,
} from "../authz/openfga.ts";
import { requireSession } from "../middleware/session.ts";
import { createQuestionSchema, reviewActionSchema } from "../questions/schema.ts";
import {
  createQuestionWithParts,
  getQuestionBundle,
  listMyQuestions,
  listPendingQuestions,
  listTopics,
  reviewQuestion,
  submitQuestion,
} from "../questions/service.ts";

type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: {
    userId: string;
    userEmail: string;
    userName: string;
  };
};

export const questionsRoutes = new Hono<AppEnv>();

questionsRoutes.get("/topics", async (c) => {
  const topics = await listTopics(c.env);
  return c.json({ topics });
});

questionsRoutes.use("/mine", requireSession);
questionsRoutes.get("/mine", async (c) => {
  const rows = await listMyQuestions(c.env, c.get("userId"));
  return c.json({ questions: rows });
});

questionsRoutes.use("/", requireSession);
questionsRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  await ensurePlatformMember(c.env, userId);

  const body = await c.req.json().catch(() => null);
  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  try {
    const questionId = await createQuestionWithParts(
      c.env,
      userId,
      parsed.data,
    );
    await writeQuestionAuthor(c.env, userId, questionId);
    const bundle = await getQuestionBundle(c.env, questionId);
    return c.json({ question: bundle }, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "TOPIC_NOT_FOUND") {
      return c.json({ error: "Topic not found" }, 404);
    }
    console.error("create question failed", err);
    return c.json({ error: "Failed to create question" }, 500);
  }
});

questionsRoutes.use("/:id/submit", requireSession);
questionsRoutes.post("/:id/submit", async (c) => {
  const result = await submitQuestion(c.env, c.req.param("id"), c.get("userId"));
  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  if (result.error === "FORBIDDEN") return c.json({ error: "Forbidden" }, 403);
  if (result.error === "INVALID_STATUS") {
    return c.json({ error: "Only draft or rejected questions can be submitted" }, 409);
  }
  return c.json({ ok: true });
});

questionsRoutes.use("/:id", requireSession);
questionsRoutes.get("/:id", async (c) => {
  const bundle = await getQuestionBundle(c.env, c.req.param("id"));
  if (!bundle) return c.json({ error: "Not found" }, 404);

  const userId = c.get("userId");
  const isAuthor = bundle.question.authorId === userId;
  const isReviewer = await canReviewQuestions(c.env, userId);
  const isApproved = bundle.question.status === "approved";

  if (!isApproved && !isAuthor && !isReviewer) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json({ question: bundle });
});

export const reviewRoutes = new Hono<AppEnv>();

reviewRoutes.use("*", requireSession);
reviewRoutes.use("*", async (c, next) => {
  const allowed = await canReviewQuestions(c.env, c.get("userId"));
  if (!allowed) return c.json({ error: "Forbidden" }, 403);
  await next();
});

reviewRoutes.get("/pending", async (c) => {
  const rows = await listPendingQuestions(c.env);
  return c.json({ questions: rows });
});

reviewRoutes.post("/:id/approve", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = reviewActionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body" }, 400);
  }

  const result = await reviewQuestion(c.env, {
    questionId: c.req.param("id"),
    reviewerId: c.get("userId"),
    action: "approve",
    note: parsed.data.note,
  });

  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  if (result.error === "INVALID_STATUS") {
    return c.json({ error: "Question is not pending" }, 409);
  }
  return c.json({ ok: true });
});

reviewRoutes.post("/:id/reject", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = reviewActionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body" }, 400);
  }

  const result = await reviewQuestion(c.env, {
    questionId: c.req.param("id"),
    reviewerId: c.get("userId"),
    action: "reject",
    note: parsed.data.note,
  });

  if (result.error === "NOT_FOUND") return c.json({ error: "Not found" }, 404);
  if (result.error === "INVALID_STATUS") {
    return c.json({ error: "Question is not pending" }, 409);
  }
  return c.json({ ok: true });
});
