import { eq, desc, count, avg, sql, and } from "drizzle-orm";

import { createDb } from "../db/index.ts";
import {
  question,
  questionOption,
  requestLog,
  device,
  uiEvent,
  user,
} from "../db/schema.ts";
import { getLeaderboard, submitAttempt as submitAttemptService } from "../learn/service.ts";
import { getLearningStats, toggleBookmark as toggleBookmarkService } from "../learn/engagement.ts";
import { getUserRoles } from "../authz/openfga.ts";
import { createAuth } from "../auth/index.ts";

export interface GraphQLContext {
  env: CloudflareBindings;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export const rootResolver = {
  leaderboard: async (args: { limit?: number }, ctx: GraphQLContext) => {
    const limit = Math.min(args.limit || 50, 100);
    const data = await getLeaderboard(ctx.env);
    return data.slice(0, limit);
  },

  telemetry: async (args: { period?: string }, ctx: GraphQLContext) => {
    const db = createDb(ctx.env.HYPERDRIVE);

    const [reqStats] = await db
      .select({
        totalRequests: count(requestLog.id),
        avgLatencyMs: avg(requestLog.latencyMs),
      })
      .from(requestLog);

    const [errStats] = await db
      .select({ errorCount: count(requestLog.id) })
      .from(requestLog)
      .where(sql`${requestLog.statusCode} >= 400`);

    const [devStats] = await db
      .select({ activeDevices: count(device.id) })
      .from(device);

    const [uiStats] = await db
      .select({ uiEventsCount: count(uiEvent.id) })
      .from(uiEvent);

    const topPaths = await db
      .select({
        path: requestLog.path,
        count: count(requestLog.id),
      })
      .from(requestLog)
      .groupBy(requestLog.path)
      .orderBy(desc(count(requestLog.id)))
      .limit(5);

    return {
      totalRequests: reqStats?.totalRequests ?? 0,
      avgLatencyMs: reqStats?.avgLatencyMs ? Number(reqStats.avgLatencyMs) : 0,
      errorCount: errStats?.errorCount ?? 0,
      activeDevices: devStats?.activeDevices ?? 0,
      uiEventsCount: uiStats?.uiEventsCount ?? 0,
      topPaths: topPaths.map((p) => ({ path: p.path, count: p.count })),
    };
  },

  questions: async (
    args: { topicId?: string; status?: string; limit?: number },
    ctx: GraphQLContext,
  ) => {
    const db = createDb(ctx.env.HYPERDRIVE);
    const limit = Math.min(args.limit || 50, 100);

    const conditions = [];
    if (args.topicId) conditions.push(eq(question.topicId, args.topicId));
    if (args.status) {
      conditions.push(eq(question.status, args.status));
    } else {
      conditions.push(eq(question.status, "approved"));
    }

    const rows = await db
      .select()
      .from(question)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit);

    return rows.map((q) => ({
      ...q,
      publishedAt: q.publishedAt ? q.publishedAt.toISOString() : null,
    }));
  },

  question: async (args: { id: string }, ctx: GraphQLContext) => {
    const db = createDb(ctx.env.HYPERDRIVE);
    const [q] = await db
      .select()
      .from(question)
      .where(eq(question.id, args.id))
      .limit(1);

    if (!q) return null;

    const opts = await db
      .select()
      .from(questionOption)
      .where(eq(questionOption.questionId, q.id));

    return {
      ...q,
      publishedAt: q.publishedAt ? q.publishedAt.toISOString() : null,
      options: opts,
    };
  },

  me: async (_args: unknown, ctx: GraphQLContext) => {
    if (!ctx.userId) return null;
    const db = createDb(ctx.env.HYPERDRIVE);

    const [usr] = await db
      .select()
      .from(user)
      .where(eq(user.id, ctx.userId))
      .limit(1);

    if (!usr) return null;

    const roles = await getUserRoles(ctx.env, ctx.userId);
    const stats = await getLearningStats(ctx.env, ctx.userId);

    return {
      id: usr.id,
      name: usr.name,
      email: usr.email,
      image: usr.image,
      roles,
      stats: {
        dailyGoal: stats.dailyGoal,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastActiveDate: stats.lastActiveDate,
        dueReviewCount: stats.dueReviewCount,
        bookmarkCount: stats.bookmarkCount,
      },
    };
  },

  submitAttempt: async (
    args: { questionId: string; selectedOptionIds?: string[]; booleanValue?: boolean },
    ctx: GraphQLContext,
  ) => {
    if (!ctx.userId) {
      throw new Error("Authentication required to submit attempt");
    }

    const res = await submitAttemptService(
      ctx.env,
      ctx.userId,
      args.questionId,
      {
        optionIds: args.selectedOptionIds || [],
        booleanValue: args.booleanValue,
      },
    );

    if (res.error) {
      throw new Error(`Attempt submission failed: ${res.error}`);
    }

    return {
      id: res.result!.attemptId,
      isCorrect: res.result!.isCorrect,
      confidence: null,
    };
  },

  contributeQuestion: async (
    args: {
      input: {
        topicId: string;
        type: string;
        title: string;
        prompt: string;
        explanation: string;
        whyWrong?: string;
        difficulty?: string;
        codeSnippet?: string;
      };
    },
    ctx: GraphQLContext,
  ) => {
    if (!ctx.userId) {
      throw new Error("Authentication required to contribute question");
    }

    const db = createDb(ctx.env.HYPERDRIVE);
    const id = crypto.randomUUID();

    await db.insert(question).values({
      id,
      topicId: args.input.topicId,
      type: args.input.type,
      status: "draft",
      title: args.input.title,
      prompt: args.input.prompt,
      explanation: args.input.explanation,
      whyWrong: args.input.whyWrong || null,
      difficulty: args.input.difficulty || "beginner",
      codeSnippet: args.input.codeSnippet || null,
      authorId: ctx.userId,
    });

    const [created] = await db
      .select()
      .from(question)
      .where(eq(question.id, id))
      .limit(1);

    return {
      ...created,
      publishedAt: created.publishedAt ? created.publishedAt.toISOString() : null,
      options: [],
    };
  },

  toggleBookmark: async (
    args: { questionId: string },
    ctx: GraphQLContext,
  ) => {
    if (!ctx.userId) {
      throw new Error("Authentication required to bookmark questions");
    }

    const res = await toggleBookmarkService(ctx.env, ctx.userId, args.questionId);
    return { bookmarked: res.bookmarked };
  },
};
