import { and, asc, count, desc, eq, inArray, lte, or, sql } from "drizzle-orm";

import { createDb } from "../db/index.ts";
import {
  attempt,
  explanationVote,
  learningPath,
  question,
  questionDuplicateFlag,
  questionSet,
  questionSetItem,
  spacedReview,
  topic,
  uiEvent,
  userLearning,
} from "../db/schema.ts";
import { ensureUserLearning } from "./engagement.ts";

function getDb(env: CloudflareBindings) {
  return createDb(env.HYPERDRIVE);
}

export async function recordContinuePointer(
  env: CloudflareBindings,
  userId: string,
  opts: {
    questionId?: string | null;
    topicId?: string | null;
    pathId?: string | null;
  },
) {
  await ensureUserLearning(env, userId);
  const db = getDb(env);
  const patch: {
    lastQuestionId?: string;
    lastTopicId?: string;
    lastPathId?: string;
    lastActivityAt: Date;
    updatedAt: Date;
  } = {
    lastActivityAt: new Date(),
    updatedAt: new Date(),
  };
  if (opts.questionId) patch.lastQuestionId = opts.questionId;
  if (opts.topicId) patch.lastTopicId = opts.topicId;
  if (opts.pathId) patch.lastPathId = opts.pathId;
  await db
    .update(userLearning)
    .set(patch)
    .where(eq(userLearning.userId, userId));
}

export async function getContinueWhereLeftOff(
  env: CloudflareBindings,
  userId: string,
) {
  await ensureUserLearning(env, userId);
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(userLearning)
    .where(eq(userLearning.userId, userId))
    .limit(1);

  if (!row) return null;

  let questionTitle: string | null = null;
  let topicTitle: string | null = null;
  let pathTitle: string | null = null;

  if (row.lastQuestionId) {
    const [q] = await db
      .select({ title: question.title })
      .from(question)
      .where(eq(question.id, row.lastQuestionId))
      .limit(1);
    questionTitle = q?.title ?? null;
  }
  if (row.lastTopicId) {
    const [t] = await db
      .select({ title: topic.title })
      .from(topic)
      .where(eq(topic.id, row.lastTopicId))
      .limit(1);
    topicTitle = t?.title ?? null;
  }
  if (row.lastPathId) {
    const [p] = await db
      .select({ title: learningPath.title })
      .from(learningPath)
      .where(eq(learningPath.id, row.lastPathId))
      .limit(1);
    pathTitle = p?.title ?? null;
  }

  const [due] = await db
    .select({ value: count() })
    .from(spacedReview)
    .where(
      and(eq(spacedReview.userId, userId), lte(spacedReview.dueAt, new Date())),
    );

  return {
    lastQuestionId: row.lastQuestionId,
    lastQuestionTitle: questionTitle,
    lastTopicId: row.lastTopicId,
    lastTopicTitle: topicTitle,
    lastPathId: row.lastPathId,
    lastPathTitle: pathTitle,
    lastActivityAt: row.lastActivityAt,
    dueCount: Number(due?.value ?? 0),
  };
}

export async function listTopicMastery(
  env: CloudflareBindings,
  userId?: string,
) {
  const db = getDb(env);
  const topics = await db.select().from(topic).orderBy(asc(topic.sortOrder));

  const approvedCounts = await db
    .select({
      topicId: question.topicId,
      total: count(question.id),
    })
    .from(question)
    .where(eq(question.status, "approved"))
    .groupBy(question.topicId);

  const totalMap = new Map(
    approvedCounts.map((r) => [r.topicId, Number(r.total)]),
  );

  if (!userId) {
    return topics.map((t) => ({
      topicId: t.id,
      title: t.title,
      description: t.description,
      prerequisiteTopicId: t.prerequisiteTopicId,
      approvedCount: totalMap.get(t.id) ?? 0,
      attempted: 0,
      correct: 0,
      remaining: totalMap.get(t.id) ?? 0,
      masteryPercent: 0,
    }));
  }

  const userAttempts = await db
    .select({
      topicId: question.topicId,
      attempted: count(attempt.id),
      correct: sql<number>`cast(sum(case when ${attempt.isCorrect} then 1 else 0 end) as int)`.mapWith(
        Number,
      ),
    })
    .from(attempt)
    .innerJoin(question, eq(question.id, attempt.questionId))
    .where(and(eq(attempt.userId, userId), eq(question.status, "approved")))
    .groupBy(question.topicId);

  const attemptMap = new Map(
    userAttempts.map((r) => [
      r.topicId,
      { attempted: Number(r.attempted), correct: Number(r.correct) },
    ]),
  );

  return topics.map((t) => {
    const total = totalMap.get(t.id) ?? 0;
    const stats = attemptMap.get(t.id) ?? { attempted: 0, correct: 0 };
    const remaining = Math.max(0, total - stats.attempted);
    const masteryPercent =
      total === 0 ? 0 : Math.round((stats.correct / total) * 100);
    return {
      topicId: t.id,
      title: t.title,
      description: t.description,
      prerequisiteTopicId: t.prerequisiteTopicId,
      approvedCount: total,
      attempted: stats.attempted,
      correct: stats.correct,
      remaining,
      masteryPercent,
    };
  });
}

export async function listWeakTopicDrill(
  env: CloudflareBindings,
  userId: string,
  limit = 20,
) {
  const db = getDb(env);
  const wrongs = await db
    .select({
      questionId: attempt.questionId,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      topicId: question.topicId,
      topicTitle: topic.title,
      attemptedAt: attempt.createdAt,
    })
    .from(attempt)
    .innerJoin(question, eq(question.id, attempt.questionId))
    .innerJoin(topic, eq(topic.id, question.topicId))
    .where(
      and(
        eq(attempt.userId, userId),
        eq(attempt.isCorrect, false),
        eq(question.status, "approved"),
      ),
    )
    .orderBy(desc(attempt.createdAt))
    .limit(limit);

  return wrongs;
}

export async function getTopicPrerequisiteGate(
  env: CloudflareBindings,
  topicId: string,
  userId?: string,
) {
  const db = getDb(env);
  const [t] = await db.select().from(topic).where(eq(topic.id, topicId)).limit(1);
  if (!t?.prerequisiteTopicId) {
    return { blocked: false as const, prerequisite: null };
  }

  const [pre] = await db
    .select()
    .from(topic)
    .where(eq(topic.id, t.prerequisiteTopicId))
    .limit(1);
  if (!pre) return { blocked: false as const, prerequisite: null };

  if (!userId) {
    return {
      blocked: false as const,
      warn: true as const,
      prerequisite: { id: pre.id, title: pre.title },
      masteryPercent: 0,
    };
  }

  const mastery = await listTopicMastery(env, userId);
  const preMastery = mastery.find((m) => m.topicId === pre.id);
  const masteryPercent = preMastery?.masteryPercent ?? 0;
  const warn = masteryPercent < 40;

  return {
    blocked: false as const,
    warn,
    prerequisite: { id: pre.id, title: pre.title },
    masteryPercent,
  };
}

export async function voteExplanation(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
  helpful: boolean,
) {
  const db = getDb(env);
  const [q] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, questionId), eq(question.status, "approved")))
    .limit(1);
  if (!q) return { error: "NOT_FOUND" as const };

  const [existing] = await db
    .select()
    .from(explanationVote)
    .where(
      and(
        eq(explanationVote.questionId, questionId),
        eq(explanationVote.userId, userId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(explanationVote)
      .set({ helpful })
      .where(eq(explanationVote.id, existing.id));
    return { error: null, id: existing.id };
  }

  const id = crypto.randomUUID();
  await db.insert(explanationVote).values({
    id,
    questionId,
    userId,
    helpful,
    createdAt: new Date(),
  });
  return { error: null, id };
}

export async function getExplanationVoteStats(
  env: CloudflareBindings,
  questionId: string,
  userId?: string,
) {
  const db = getDb(env);
  const [stats] = await db
    .select({
      helpful: sql<number>`cast(sum(case when ${explanationVote.helpful} then 1 else 0 end) as int)`.mapWith(
        Number,
      ),
      unhelpful: sql<number>`cast(sum(case when ${explanationVote.helpful} then 0 else 1 end) as int)`.mapWith(
        Number,
      ),
    })
    .from(explanationVote)
    .where(eq(explanationVote.questionId, questionId));

  let mine: boolean | null = null;
  if (userId) {
    const [row] = await db
      .select()
      .from(explanationVote)
      .where(
        and(
          eq(explanationVote.questionId, questionId),
          eq(explanationVote.userId, userId),
        ),
      )
      .limit(1);
    mine = row ? row.helpful : null;
  }

  return {
    helpful: Number(stats?.helpful ?? 0),
    unhelpful: Number(stats?.unhelpful ?? 0),
    mine,
  };
}

export async function getCommunityCalibration(
  env: CloudflareBindings,
  questionId: string,
) {
  const db = getDb(env);
  const [stats] = await db
    .select({
      attempts: count(attempt.id),
      correct: sql<number>`cast(sum(case when ${attempt.isCorrect} then 1 else 0 end) as int)`.mapWith(
        Number,
      ),
    })
    .from(attempt)
    .where(eq(attempt.questionId, questionId));

  const attempts = Number(stats?.attempts ?? 0);
  const correct = Number(stats?.correct ?? 0);
  return {
    attempts,
    correct,
    percentCorrect: attempts === 0 ? null : Math.round((correct / attempts) * 100),
  };
}

export async function flagDuplicateQuestion(
  env: CloudflareBindings,
  reporterId: string,
  questionId: string,
  opts: { similarQuestionId?: string; note?: string },
) {
  const db = getDb(env);
  const [q] = await db
    .select()
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1);
  if (!q) return { error: "NOT_FOUND" as const };

  const id = crypto.randomUUID();
  await db.insert(questionDuplicateFlag).values({
    id,
    questionId,
    similarQuestionId: opts.similarQuestionId ?? null,
    reporterId,
    note: opts.note ?? null,
    status: "open",
    createdAt: new Date(),
  });

  if (opts.similarQuestionId) {
    await db
      .update(question)
      .set({ similarQuestionId: opts.similarQuestionId, updatedAt: new Date() })
      .where(eq(question.id, questionId));
  }

  return { error: null, id };
}

export async function listOpenDuplicateFlags(env: CloudflareBindings) {
  const db = getDb(env);
  return db
    .select({
      id: questionDuplicateFlag.id,
      questionId: questionDuplicateFlag.questionId,
      questionTitle: question.title,
      similarQuestionId: questionDuplicateFlag.similarQuestionId,
      note: questionDuplicateFlag.note,
      createdAt: questionDuplicateFlag.createdAt,
      reporterId: questionDuplicateFlag.reporterId,
    })
    .from(questionDuplicateFlag)
    .innerJoin(question, eq(question.id, questionDuplicateFlag.questionId))
    .where(eq(questionDuplicateFlag.status, "open"))
    .orderBy(asc(questionDuplicateFlag.createdAt));
}

export async function resolveDuplicateFlag(
  env: CloudflareBindings,
  flagId: string,
  status: "resolved" | "dismissed",
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(questionDuplicateFlag)
    .where(eq(questionDuplicateFlag.id, flagId))
    .limit(1);
  if (!row) return { error: "NOT_FOUND" as const };
  await db
    .update(questionDuplicateFlag)
    .set({ status })
    .where(eq(questionDuplicateFlag.id, flagId));
  return { error: null };
}

export async function getPlaylistRunner(
  env: CloudflareBindings,
  setIdOrSlug: string,
  userId?: string,
) {
  const db = getDb(env);
  const [set] = await db
    .select()
    .from(questionSet)
    .where(or(eq(questionSet.id, setIdOrSlug), eq(questionSet.slug, setIdOrSlug)))
    .limit(1);
  if (!set) return null;
  if (!set.isPublic && set.ownerId !== userId) return null;

  const items = await db
    .select({
      questionId: questionSetItem.questionId,
      sortOrder: questionSetItem.sortOrder,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      status: question.status,
    })
    .from(questionSetItem)
    .innerJoin(question, eq(question.id, questionSetItem.questionId))
    .where(eq(questionSetItem.setId, set.id))
    .orderBy(asc(questionSetItem.sortOrder));

  const approved = items.filter((i) => i.status === "approved");
  let attemptedIds = new Set<string>();
  if (userId && approved.length) {
    const attempts = await db
      .select({ questionId: attempt.questionId, isCorrect: attempt.isCorrect })
      .from(attempt)
      .where(
        and(
          eq(attempt.userId, userId),
          inArray(
            attempt.questionId,
            approved.map((a) => a.questionId),
          ),
        ),
      );
    attemptedIds = new Set(attempts.map((a) => a.questionId));
  }

  const next =
    approved.find((a) => !attemptedIds.has(a.questionId)) ?? approved[0] ?? null;

  return {
    set: {
      id: set.id,
      slug: set.slug,
      title: set.title,
      description: set.description,
    },
    items: approved.map((a) => ({
      questionId: a.questionId,
      title: a.title,
      type: a.type,
      difficulty: a.difficulty,
      attempted: attemptedIds.has(a.questionId),
    })),
    nextQuestionId: next?.questionId ?? null,
  };
}

export async function ingestUiEvents(
  env: CloudflareBindings,
  userId: string | undefined,
  events: {
    eventName: string;
    route?: string;
    questionId?: string;
    targetId?: string;
    durationMs?: number;
    meta?: Record<string, unknown>;
    sessionKey?: string;
  }[],
) {
  const db = getDb(env);
  const now = new Date();
  for (const event of events.slice(0, 50)) {
    await db.insert(uiEvent).values({
      id: crypto.randomUUID(),
      userId: userId ?? null,
      sessionKey: event.sessionKey ?? null,
      route: event.route ?? null,
      questionId: event.questionId ?? null,
      eventName: event.eventName,
      targetId: event.targetId ?? null,
      durationMs: event.durationMs ?? null,
      meta: event.meta ? JSON.stringify(event.meta) : null,
      createdAt: now,
    });
  }
  return { accepted: Math.min(events.length, 50) };
}
