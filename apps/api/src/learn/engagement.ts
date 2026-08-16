import { and, asc, count, desc, eq, inArray, lte, sql } from "drizzle-orm";

import { createDb } from "../db/index.ts";
import {
  attempt,
  bookmark,
  learningPath,
  learningPathTopic,
  question,
  spacedReview,
  topic,
  userLearning,
} from "../db/schema.ts";

function getDb(env: CloudflareBindings) {
  return createDb(env.HYPERDRIVE);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function ensureUserLearning(
  env: CloudflareBindings,
  userId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(userLearning)
    .where(eq(userLearning.userId, userId))
    .limit(1);
  if (row) return row;

  await db.insert(userLearning).values({
    userId,
    dailyGoal: 3,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    updatedAt: new Date(),
  });

  const [created] = await db
    .select()
    .from(userLearning)
    .where(eq(userLearning.userId, userId))
    .limit(1);
  return created!;
}

export async function getLearningStats(env: CloudflareBindings, userId: string) {
  const row = await ensureUserLearning(env, userId);
  const db = getDb(env);
  const today = todayUtc();

  const [todayCount] = await db
    .select({ value: count() })
    .from(attempt)
    .where(
      and(
        eq(attempt.userId, userId),
        sql`(${attempt.createdAt})::date = ${today}::date`,
      ),
    );

  return {
    dailyGoal: row.dailyGoal,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastActiveDate: row.lastActiveDate,
    todayAttemptCount: Number(todayCount?.value ?? 0),
  };
}

export async function updateDailyGoal(
  env: CloudflareBindings,
  userId: string,
  dailyGoal: number,
) {
  await ensureUserLearning(env, userId);
  const db = getDb(env);
  await db
    .update(userLearning)
    .set({ dailyGoal, updatedAt: new Date() })
    .where(eq(userLearning.userId, userId));
  return getLearningStats(env, userId);
}

export async function recordActivityStreak(
  env: CloudflareBindings,
  userId: string,
) {
  const row = await ensureUserLearning(env, userId);
  const db = getDb(env);
  const today = todayUtc();
  const last = row.lastActiveDate;

  if (last === today) return row;

  let currentStreak = 1;
  if (last) {
    const yesterday = addDays(new Date(`${today}T00:00:00.000Z`), -1)
      .toISOString()
      .slice(0, 10);
    if (last === yesterday) currentStreak = row.currentStreak + 1;
  }

  const longestStreak = Math.max(row.longestStreak, currentStreak);
  await db
    .update(userLearning)
    .set({
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userLearning.userId, userId));

  return {
    ...row,
    currentStreak,
    longestStreak,
    lastActiveDate: today,
  };
}

export async function upsertSpacedReview(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
  isCorrect: boolean,
) {
  const db = getDb(env);
  const [existing] = await db
    .select()
    .from(spacedReview)
    .where(
      and(
        eq(spacedReview.userId, userId),
        eq(spacedReview.questionId, questionId),
      ),
    )
    .limit(1);

  const now = new Date();

  if (!isCorrect) {
    const dueAt = addDays(now, 1);
    if (existing) {
      await db
        .update(spacedReview)
        .set({
          dueAt,
          intervalDays: 1,
          easeFactor: Math.max(1.3, existing.easeFactor - 0.2),
          repetitions: 0,
          updatedAt: now,
        })
        .where(eq(spacedReview.id, existing.id));
    } else {
      await db.insert(spacedReview).values({
        id: crypto.randomUUID(),
        userId,
        questionId,
        dueAt,
        intervalDays: 1,
        easeFactor: 2.3,
        repetitions: 0,
        updatedAt: now,
      });
    }
    return;
  }

  const intervalDays = existing
    ? Math.max(1, Math.round(existing.intervalDays * existing.easeFactor))
    : 3;
  const dueAt = addDays(now, intervalDays);
  const easeFactor = existing ? existing.easeFactor + 0.05 : 2.5;
  const repetitions = (existing?.repetitions ?? 0) + 1;

  if (existing) {
    await db
      .update(spacedReview)
      .set({
        dueAt,
        intervalDays,
        easeFactor,
        repetitions,
        updatedAt: now,
      })
      .where(eq(spacedReview.id, existing.id));
  } else {
    await db.insert(spacedReview).values({
      id: crypto.randomUUID(),
      userId,
      questionId,
      dueAt,
      intervalDays,
      easeFactor,
      repetitions,
      updatedAt: now,
    });
  }
}

export async function listDueReviews(env: CloudflareBindings, userId: string) {
  const db = getDb(env);
  const now = new Date();
  const rows = await db
    .select({
      questionId: spacedReview.questionId,
      dueAt: spacedReview.dueAt,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      topicId: question.topicId,
    })
    .from(spacedReview)
    .innerJoin(question, eq(question.id, spacedReview.questionId))
    .where(
      and(
        eq(spacedReview.userId, userId),
        lte(spacedReview.dueAt, now),
        eq(question.status, "approved"),
      ),
    )
    .orderBy(asc(spacedReview.dueAt));

  return rows;
}

export async function listMistakes(env: CloudflareBindings, userId: string) {
  const db = getDb(env);
  return db
    .select({
      questionId: attempt.questionId,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      topicId: question.topicId,
      attemptedAt: attempt.createdAt,
    })
    .from(attempt)
    .innerJoin(question, eq(question.id, attempt.questionId))
    .where(
      and(
        eq(attempt.userId, userId),
        eq(attempt.isCorrect, false),
        eq(question.status, "approved"),
      ),
    )
    .orderBy(desc(attempt.createdAt));
}

export async function listBookmarks(env: CloudflareBindings, userId: string) {
  const db = getDb(env);
  return db
    .select({
      id: bookmark.id,
      questionId: bookmark.questionId,
      createdAt: bookmark.createdAt,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      topicId: question.topicId,
    })
    .from(bookmark)
    .innerJoin(question, eq(question.id, bookmark.questionId))
    .where(eq(bookmark.userId, userId))
    .orderBy(desc(bookmark.createdAt));
}

export async function addBookmark(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
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
    .from(bookmark)
    .where(
      and(eq(bookmark.userId, userId), eq(bookmark.questionId, questionId)),
    )
    .limit(1);
  if (existing) return { error: null, id: existing.id };

  const id = crypto.randomUUID();
  await db.insert(bookmark).values({
    id,
    userId,
    questionId,
    createdAt: new Date(),
  });
  return { error: null, id };
}

export async function removeBookmark(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
) {
  const db = getDb(env);
  await db
    .delete(bookmark)
    .where(
      and(eq(bookmark.userId, userId), eq(bookmark.questionId, questionId)),
    );
}

export async function isBookmarked(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(bookmark)
    .where(
      and(eq(bookmark.userId, userId), eq(bookmark.questionId, questionId)),
    )
    .limit(1);
  return Boolean(row);
}

export async function listPaths(env: CloudflareBindings, userId?: string) {
  const db = getDb(env);
  const paths = await db
    .select()
    .from(learningPath)
    .orderBy(asc(learningPath.sortOrder));

  if (!userId) {
    return paths.map((p) => ({ ...p, progressPercent: 0 }));
  }

  const withProgress = [];
  for (const path of paths) {
    const detail = await getPathDetail(env, path.id, userId);
    withProgress.push({
      ...path,
      progressPercent: detail?.progressPercent ?? 0,
    });
  }
  return withProgress;
}

export async function getPathDetail(
  env: CloudflareBindings,
  pathId: string,
  userId?: string,
) {
  const db = getDb(env);
  const [path] = await db
    .select()
    .from(learningPath)
    .where(eq(learningPath.id, pathId))
    .limit(1);
  if (!path) return null;

  const steps = await db
    .select({
      topicId: learningPathTopic.topicId,
      sortOrder: learningPathTopic.sortOrder,
      title: topic.title,
      slug: topic.slug,
      description: topic.description,
    })
    .from(learningPathTopic)
    .innerJoin(topic, eq(topic.id, learningPathTopic.topicId))
    .where(eq(learningPathTopic.pathId, pathId))
    .orderBy(asc(learningPathTopic.sortOrder));

  const topicIds = steps.map((s) => s.topicId);
  if (topicIds.length === 0) {
    return { ...path, topics: [], progressPercent: 0, approvedTotal: 0, correctCount: 0 };
  }

  const approved = await db
    .select({ id: question.id, topicId: question.topicId })
    .from(question)
    .where(
      and(eq(question.status, "approved"), inArray(question.topicId, topicIds)),
    );

  let correctIds = new Set<string>();
  if (userId && approved.length > 0) {
    const corrects = await db
      .select({ questionId: attempt.questionId })
      .from(attempt)
      .where(
        and(
          eq(attempt.userId, userId),
          eq(attempt.isCorrect, true),
          inArray(
            attempt.questionId,
            approved.map((a) => a.id),
          ),
        ),
      );
    correctIds = new Set(corrects.map((c) => c.questionId));
  }

  const byTopic = new Map<string, { total: number; correct: number }>();
  for (const q of approved) {
    const cur = byTopic.get(q.topicId) ?? { total: 0, correct: 0 };
    cur.total += 1;
    if (correctIds.has(q.id)) cur.correct += 1;
    byTopic.set(q.topicId, cur);
  }

  const topics = steps.map((s) => {
    const stats = byTopic.get(s.topicId) ?? { total: 0, correct: 0 };
    return {
      ...s,
      approvedCount: stats.total,
      correctCount: stats.correct,
      progressPercent:
        stats.total === 0
          ? 0
          : Math.round((stats.correct / stats.total) * 100),
    };
  });

  const approvedTotal = approved.length;
  const correctCount = approved.filter((q) => correctIds.has(q.id)).length;
  const progressPercent =
    approvedTotal === 0
      ? 0
      : Math.round((correctCount / approvedTotal) * 100);

  return {
    ...path,
    topics,
    approvedTotal,
    correctCount,
    progressPercent,
  };
}
