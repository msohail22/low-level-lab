import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { createDb } from "../db/index.ts";
import {
  achievement,
  authorFollow,
  attempt,
  dailyChallenge,
  glossaryTerm,
  question,
  questionAnswer,
  questionComment,
  questionHint,
  questionOption,
  questionReport,
  questionSet,
  questionSetItem,
  questionVersion,
  sandboxSubmission,
  topic,
  user,
  userAchievement,
  userLearning,
} from "../db/schema.ts";

function getDb(env: CloudflareBindings) {
  return createDb(env.HYPERDRIVE);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function grantAchievement(
  env: CloudflareBindings,
  userId: string,
  slug: string,
) {
  const db = getDb(env);
  const [ach] = await db
    .select()
    .from(achievement)
    .where(eq(achievement.slug, slug))
    .limit(1);
  if (!ach) return;

  const [existing] = await db
    .select()
    .from(userAchievement)
    .where(
      and(
        eq(userAchievement.userId, userId),
        eq(userAchievement.achievementId, ach.id),
      ),
    )
    .limit(1);
  if (existing) return;

  await db.insert(userAchievement).values({
    id: crypto.randomUUID(),
    userId,
    achievementId: ach.id,
    earnedAt: new Date(),
  });
}

export async function evaluateAchievements(
  env: CloudflareBindings,
  userId: string,
  opts?: { dailyChallengeCorrect?: boolean },
) {
  const db = getDb(env);

  const [correct] = await db
    .select({ value: count() })
    .from(attempt)
    .where(and(eq(attempt.userId, userId), eq(attempt.isCorrect, true)));
  const correctCount = Number(correct?.value ?? 0);
  if (correctCount >= 1) await grantAchievement(env, userId, "first-correct");
  if (correctCount >= 10) await grantAchievement(env, userId, "ten-correct");

  const [learning] = await db
    .select()
    .from(userLearning)
    .where(eq(userLearning.userId, userId))
    .limit(1);
  if ((learning?.currentStreak ?? 0) >= 3) {
    await grantAchievement(env, userId, "streak-3");
  }
  if ((learning?.currentStreak ?? 0) >= 7) {
    await grantAchievement(env, userId, "streak-7");
  }

  if (opts?.dailyChallengeCorrect) {
    await grantAchievement(env, userId, "daily-challenger");
  }

  const [approved] = await db
    .select({ value: count() })
    .from(question)
    .where(
      and(eq(question.authorId, userId), eq(question.status, "approved")),
    );
  if (Number(approved?.value ?? 0) >= 1) {
    await grantAchievement(env, userId, "first-contribute");
  }
}

export async function listAchievements(
  env: CloudflareBindings,
  userId?: string,
) {
  const db = getDb(env);
  const all = await db.select().from(achievement).orderBy(asc(achievement.title));
  if (!userId) {
    return all.map((a) => ({ ...a, earnedAt: null as string | null }));
  }

  const earned = await db
    .select()
    .from(userAchievement)
    .where(eq(userAchievement.userId, userId));
  const map = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

  return all.map((a) => ({
    ...a,
    earnedAt: map.get(a.id)?.toISOString() ?? null,
  }));
}

export async function getOrCreateDailyChallenge(env: CloudflareBindings) {
  const db = getDb(env);
  const today = todayUtc();

  const [existing] = await db
    .select({
      id: dailyChallenge.id,
      challengeDate: dailyChallenge.challengeDate,
      questionId: dailyChallenge.questionId,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      topicId: question.topicId,
    })
    .from(dailyChallenge)
    .innerJoin(question, eq(question.id, dailyChallenge.questionId))
    .where(eq(dailyChallenge.challengeDate, today))
    .limit(1);

  if (existing) return existing;

  const approved = await db
    .select({ id: question.id })
    .from(question)
    .where(eq(question.status, "approved"))
    .limit(100);

  if (approved.length === 0) return null;

  const pick = approved[Math.floor(Math.random() * approved.length)]!;
  const id = crypto.randomUUID();
  await db.insert(dailyChallenge).values({
    id,
    challengeDate: today,
    questionId: pick.id,
    createdAt: new Date(),
  });

  const [created] = await db
    .select({
      id: dailyChallenge.id,
      challengeDate: dailyChallenge.challengeDate,
      questionId: dailyChallenge.questionId,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      topicId: question.topicId,
    })
    .from(dailyChallenge)
    .innerJoin(question, eq(question.id, dailyChallenge.questionId))
    .where(eq(dailyChallenge.id, id))
    .limit(1);

  return created ?? null;
}

export async function getDailyChallengeLeaderboard(env: CloudflareBindings) {
  const challenge = await getOrCreateDailyChallenge(env);
  if (!challenge) return { challenge: null, leaderboard: [] };

  const db = getDb(env);
  const today = todayUtc();

  const rows = await db
    .select({
      userId: attempt.userId,
      name: user.name,
      isCorrect: attempt.isCorrect,
      createdAt: attempt.createdAt,
    })
    .from(attempt)
    .innerJoin(user, eq(user.id, attempt.userId))
    .where(
      and(
        eq(attempt.questionId, challenge.questionId),
        eq(attempt.isCorrect, true),
        sql`(${attempt.createdAt})::date = ${today}::date`,
      ),
    )
    .orderBy(asc(attempt.createdAt))
    .limit(50);

  return {
    challenge,
    leaderboard: rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: row.name,
      completedAt: row.createdAt,
    })),
  };
}

export async function listApprovedComments(
  env: CloudflareBindings,
  questionId: string,
) {
  const db = getDb(env);
  return db
    .select({
      id: questionComment.id,
      body: questionComment.body,
      createdAt: questionComment.createdAt,
      authorId: questionComment.authorId,
      authorName: user.name,
    })
    .from(questionComment)
    .innerJoin(user, eq(user.id, questionComment.authorId))
    .where(
      and(
        eq(questionComment.questionId, questionId),
        eq(questionComment.status, "approved"),
      ),
    )
    .orderBy(asc(questionComment.createdAt));
}

export async function createComment(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
  body: string,
) {
  const db = getDb(env);
  const [q] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, questionId), eq(question.status, "approved")))
    .limit(1);
  if (!q) return { error: "NOT_FOUND" as const };

  const id = crypto.randomUUID();
  await db.insert(questionComment).values({
    id,
    questionId,
    authorId: userId,
    body,
    status: "pending",
    createdAt: new Date(),
  });
  return { error: null, id };
}

export async function listPendingComments(env: CloudflareBindings) {
  const db = getDb(env);
  return db
    .select({
      id: questionComment.id,
      body: questionComment.body,
      createdAt: questionComment.createdAt,
      questionId: questionComment.questionId,
      questionTitle: question.title,
      authorId: questionComment.authorId,
      authorName: user.name,
    })
    .from(questionComment)
    .innerJoin(user, eq(user.id, questionComment.authorId))
    .innerJoin(question, eq(question.id, questionComment.questionId))
    .where(eq(questionComment.status, "pending"))
    .orderBy(asc(questionComment.createdAt));
}

export async function reviewComment(
  env: CloudflareBindings,
  commentId: string,
  action: "approve" | "reject",
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(questionComment)
    .where(eq(questionComment.id, commentId))
    .limit(1);
  if (!row) return { error: "NOT_FOUND" as const };
  if (row.status !== "pending") return { error: "INVALID_STATUS" as const };

  await db
    .update(questionComment)
    .set({ status: action === "approve" ? "approved" : "rejected" })
    .where(eq(questionComment.id, commentId));
  return { error: null };
}

export async function followAuthor(
  env: CloudflareBindings,
  followerId: string,
  authorId: string,
) {
  if (followerId === authorId) return { error: "SELF" as const };
  const db = getDb(env);
  const [author] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, authorId))
    .limit(1);
  if (!author) return { error: "NOT_FOUND" as const };

  const [existing] = await db
    .select()
    .from(authorFollow)
    .where(
      and(
        eq(authorFollow.followerId, followerId),
        eq(authorFollow.authorId, authorId),
      ),
    )
    .limit(1);
  if (existing) return { error: null, id: existing.id };

  const id = crypto.randomUUID();
  await db.insert(authorFollow).values({
    id,
    followerId,
    authorId,
    createdAt: new Date(),
  });
  return { error: null, id };
}

export async function unfollowAuthor(
  env: CloudflareBindings,
  followerId: string,
  authorId: string,
) {
  const db = getDb(env);
  await db
    .delete(authorFollow)
    .where(
      and(
        eq(authorFollow.followerId, followerId),
        eq(authorFollow.authorId, authorId),
      ),
    );
}

export async function listFollowingFeed(
  env: CloudflareBindings,
  followerId: string,
) {
  const db = getDb(env);
  const follows = await db
    .select({ authorId: authorFollow.authorId })
    .from(authorFollow)
    .where(eq(authorFollow.followerId, followerId));

  if (follows.length === 0) return [];

  const authorIds = follows.map((f) => f.authorId);
  return db
    .select({
      id: question.id,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      publishedAt: question.publishedAt,
      authorId: question.authorId,
      authorName: user.name,
    })
    .from(question)
    .innerJoin(user, eq(user.id, question.authorId))
    .where(
      and(
        inArray(question.authorId, authorIds),
        eq(question.status, "approved"),
      ),
    )
    .orderBy(desc(question.publishedAt))
    .limit(50);
}

export async function isFollowingAuthor(
  env: CloudflareBindings,
  followerId: string,
  authorId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(authorFollow)
    .where(
      and(
        eq(authorFollow.followerId, followerId),
        eq(authorFollow.authorId, authorId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function listPublicSets(env: CloudflareBindings) {
  const db = getDb(env);
  const sets = await db
    .select({
      id: questionSet.id,
      slug: questionSet.slug,
      title: questionSet.title,
      description: questionSet.description,
      ownerId: questionSet.ownerId,
      ownerName: user.name,
      createdAt: questionSet.createdAt,
    })
    .from(questionSet)
    .innerJoin(user, eq(user.id, questionSet.ownerId))
    .where(eq(questionSet.isPublic, true))
    .orderBy(desc(questionSet.updatedAt));

  return sets;
}

export async function getSetDetail(
  env: CloudflareBindings,
  setIdOrSlug: string,
  viewerId?: string,
) {
  const db = getDb(env);
  const [set] = await db
    .select({
      id: questionSet.id,
      slug: questionSet.slug,
      title: questionSet.title,
      description: questionSet.description,
      ownerId: questionSet.ownerId,
      ownerName: user.name,
      isPublic: questionSet.isPublic,
    })
    .from(questionSet)
    .innerJoin(user, eq(user.id, questionSet.ownerId))
    .where(
      or(eq(questionSet.id, setIdOrSlug), eq(questionSet.slug, setIdOrSlug)),
    )
    .limit(1);

  if (!set) return null;
  if (!set.isPublic && set.ownerId !== viewerId) return null;

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

  return {
    ...set,
    items: items.filter((i) => i.status === "approved" || set.ownerId === viewerId),
  };
}

export async function createQuestionSet(
  env: CloudflareBindings,
  ownerId: string,
  input: {
    title: string;
    description?: string;
    isPublic?: boolean;
    questionIds?: string[];
  },
) {
  const db = getDb(env);
  const id = crypto.randomUUID();
  let slug = slugify(input.title) || `set-${id.slice(0, 8)}`;

  const [clash] = await db
    .select({ id: questionSet.id })
    .from(questionSet)
    .where(eq(questionSet.slug, slug))
    .limit(1);
  if (clash) slug = `${slug}-${id.slice(0, 6)}`;

  const now = new Date();
  await db.insert(questionSet).values({
    id,
    slug,
    title: input.title,
    description: input.description ?? null,
    ownerId,
    isPublic: input.isPublic ?? true,
    createdAt: now,
    updatedAt: now,
  });

  for (const [index, questionId] of (input.questionIds ?? []).entries()) {
    await db.insert(questionSetItem).values({
      id: crypto.randomUUID(),
      setId: id,
      questionId,
      sortOrder: index,
    });
  }

  return { id, slug };
}

export async function addSetItem(
  env: CloudflareBindings,
  ownerId: string,
  setId: string,
  questionId: string,
) {
  const db = getDb(env);
  const [set] = await db
    .select()
    .from(questionSet)
    .where(eq(questionSet.id, setId))
    .limit(1);
  if (!set) return { error: "NOT_FOUND" as const };
  if (set.ownerId !== ownerId) return { error: "FORBIDDEN" as const };

  const [q] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, questionId), eq(question.status, "approved")))
    .limit(1);
  if (!q) return { error: "QUESTION_NOT_FOUND" as const };

  const [existing] = await db
    .select()
    .from(questionSetItem)
    .where(
      and(
        eq(questionSetItem.setId, setId),
        eq(questionSetItem.questionId, questionId),
      ),
    )
    .limit(1);
  if (existing) return { error: null, id: existing.id };

  const [{ value: maxOrder }] = await db
    .select({
      value: sql<number>`coalesce(max(${questionSetItem.sortOrder}), -1)`.mapWith(
        Number,
      ),
    })
    .from(questionSetItem)
    .where(eq(questionSetItem.setId, setId));

  const id = crypto.randomUUID();
  await db.insert(questionSetItem).values({
    id,
    setId,
    questionId,
    sortOrder: maxOrder + 1,
  });
  await db
    .update(questionSet)
    .set({ updatedAt: new Date() })
    .where(eq(questionSet.id, setId));
  return { error: null, id };
}

export async function getHintCount(
  env: CloudflareBindings,
  questionId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select({ value: count() })
    .from(questionHint)
    .where(eq(questionHint.questionId, questionId));
  return Number(row?.value ?? 0);
}

export async function revealHint(
  env: CloudflareBindings,
  questionId: string,
  revealIndex: number,
) {
  const db = getDb(env);
  const hints = await db
    .select()
    .from(questionHint)
    .where(eq(questionHint.questionId, questionId))
    .orderBy(asc(questionHint.sortOrder));

  if (hints.length === 0) return { error: "NONE" as const };
  if (revealIndex < 0 || revealIndex >= hints.length) {
    return { error: "OUT_OF_RANGE" as const, hintCount: hints.length };
  }

  return {
    error: null,
    hint: {
      index: revealIndex,
      body: hints[revealIndex]!.body,
      remaining: hints.length - revealIndex - 1,
    },
    hintCount: hints.length,
  };
}

export async function insertHints(
  env: CloudflareBindings,
  questionId: string,
  hints: string[],
) {
  const db = getDb(env);
  for (const [index, body] of hints.entries()) {
    if (!body.trim()) continue;
    await db.insert(questionHint).values({
      id: crypto.randomUUID(),
      questionId,
      sortOrder: index,
      body: body.trim(),
    });
  }
}

export async function suggestNextQuestion(
  env: CloudflareBindings,
  questionId: string,
  userId?: string,
) {
  const db = getDb(env);
  const [current] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, questionId), eq(question.status, "approved")))
    .limit(1);
  if (!current) return null;

  if (current.relatedQuestionId) {
    const [related] = await db
      .select({
        id: question.id,
        title: question.title,
        reason: sql<string>`'related'`.mapWith(String),
      })
      .from(question)
      .where(
        and(
          eq(question.id, current.relatedQuestionId),
          eq(question.status, "approved"),
        ),
      )
      .limit(1);
    if (related) return related;
  }

  let attemptedIds = new Set<string>();
  if (userId) {
    const attempts = await db
      .select({ questionId: attempt.questionId })
      .from(attempt)
      .where(eq(attempt.userId, userId));
    attemptedIds = new Set(attempts.map((a) => a.questionId));
  }

  const sameTopic = await db
    .select({
      id: question.id,
      title: question.title,
      difficulty: question.difficulty,
    })
    .from(question)
    .where(
      and(
        eq(question.topicId, current.topicId),
        eq(question.status, "approved"),
        ne(question.id, questionId),
      ),
    )
    .orderBy(asc(question.publishedAt));

  const unattempted = sameTopic.filter((q) => !attemptedIds.has(q.id));
  const pool = unattempted.length > 0 ? unattempted : sameTopic;
  if (pool.length === 0) return null;

  const difficultyRank: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };
  const currentRank = difficultyRank[current.difficulty] ?? 1;

  const adaptive = [...pool].sort((a, b) => {
    const da = Math.abs((difficultyRank[a.difficulty] ?? 1) - currentRank);
    const dbDiff = Math.abs((difficultyRank[b.difficulty] ?? 1) - currentRank);
    return da - dbDiff;
  })[0]!;

  return {
    id: adaptive.id,
    title: adaptive.title,
    reason: unattempted.length > 0 ? "adaptive_unattempted" : "adaptive_same_topic",
  };
}

export async function listGlossary(
  env: CloudflareBindings,
  topicId?: string,
) {
  const db = getDb(env);
  const conditions = topicId ? [eq(glossaryTerm.topicId, topicId)] : [];
  return db
    .select({
      id: glossaryTerm.id,
      slug: glossaryTerm.slug,
      term: glossaryTerm.term,
      definition: glossaryTerm.definition,
      topicId: glossaryTerm.topicId,
      topicTitle: topic.title,
    })
    .from(glossaryTerm)
    .leftJoin(topic, eq(topic.id, glossaryTerm.topicId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(glossaryTerm.term));
}

export async function getGlossaryTerm(env: CloudflareBindings, slug: string) {
  const db = getDb(env);
  const [row] = await db
    .select({
      id: glossaryTerm.id,
      slug: glossaryTerm.slug,
      term: glossaryTerm.term,
      definition: glossaryTerm.definition,
      topicId: glossaryTerm.topicId,
      topicTitle: topic.title,
    })
    .from(glossaryTerm)
    .leftJoin(topic, eq(topic.id, glossaryTerm.topicId))
    .where(eq(glossaryTerm.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function submitSandbox(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
  input: { sourceCode?: string; submittedOutput?: string },
) {
  const db = getDb(env);
  const [q] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, questionId), eq(question.status, "approved")))
    .limit(1);
  if (!q) return { error: "NOT_FOUND" as const };

  // Full compiler sandbox runs via Reactor (not on Workers). print_output
  // checks predicted stdout against the correct option body.
  if (q.type !== "print_output") {
    const id = crypto.randomUUID();
    await db.insert(sandboxSubmission).values({
      id,
      questionId,
      userId,
      sourceCode: input.sourceCode ?? null,
      submittedOutput: input.submittedOutput ?? null,
      isCorrect: null,
      feedback:
        "Code runner is not configured on this Worker. Use print_output questions to check predicted stdout, or wire Reactor (reactor/ + packages/reactor-sdk).",
      createdAt: new Date(),
    });
    return {
      error: null,
      result: {
        id,
        mode: "stub" as const,
        isCorrect: null as boolean | null,
        feedback:
          "Code runner is not configured. Output checking is available for print_output questions; full compile/run will use Reactor.",
      },
    };
  }

  const answers = await db
    .select({
      optionId: questionAnswer.optionId,
      body: questionOption.body,
    })
    .from(questionAnswer)
    .innerJoin(
      questionOption,
      eq(questionOption.id, questionAnswer.optionId),
    )
    .where(
      and(
        eq(questionAnswer.questionId, questionId),
        eq(questionAnswer.isCorrect, true),
      ),
    );

  const expected = (answers[0]?.body ?? "").trim();
  const got = (input.submittedOutput ?? "").trim();
  const isCorrect = expected.length > 0 && expected === got;

  const id = crypto.randomUUID();
  await db.insert(sandboxSubmission).values({
    id,
    questionId,
    userId,
    sourceCode: input.sourceCode ?? q.codeSnippet,
    submittedOutput: input.submittedOutput ?? null,
    isCorrect,
    feedback: isCorrect
      ? "Output matches the expected result."
      : "Output does not match the expected result.",
    createdAt: new Date(),
  });

  return {
    error: null,
    result: {
      id,
      mode: "output_check" as const,
      isCorrect,
      feedback: isCorrect
        ? "Output matches the expected result."
        : "Output does not match the expected result.",
    },
  };
}

export async function reportQuestion(
  env: CloudflareBindings,
  reporterId: string,
  questionId: string,
  reason: string,
  details?: string,
) {
  const db = getDb(env);
  const [q] = await db
    .select()
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1);
  if (!q) return { error: "NOT_FOUND" as const };

  const id = crypto.randomUUID();
  await db.insert(questionReport).values({
    id,
    questionId,
    reporterId,
    reason,
    details: details ?? null,
    status: "open",
    createdAt: new Date(),
  });
  return { error: null, id };
}

export async function listOpenReports(env: CloudflareBindings) {
  const db = getDb(env);
  return db
    .select({
      id: questionReport.id,
      reason: questionReport.reason,
      details: questionReport.details,
      createdAt: questionReport.createdAt,
      questionId: questionReport.questionId,
      questionTitle: question.title,
      reporterId: questionReport.reporterId,
      reporterName: user.name,
    })
    .from(questionReport)
    .innerJoin(question, eq(question.id, questionReport.questionId))
    .innerJoin(user, eq(user.id, questionReport.reporterId))
    .where(eq(questionReport.status, "open"))
    .orderBy(asc(questionReport.createdAt));
}

export async function resolveReport(
  env: CloudflareBindings,
  reportId: string,
  status: "resolved" | "dismissed",
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(questionReport)
    .where(eq(questionReport.id, reportId))
    .limit(1);
  if (!row) return { error: "NOT_FOUND" as const };

  await db
    .update(questionReport)
    .set({ status })
    .where(eq(questionReport.id, reportId));
  return { error: null };
}

export async function snapshotQuestionVersion(
  env: CloudflareBindings,
  questionId: string,
  editorId: string | null,
) {
  const db = getDb(env);
  const [q] = await db
    .select()
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1);
  if (!q) return;

  const options = await db
    .select()
    .from(questionOption)
    .where(eq(questionOption.questionId, questionId))
    .orderBy(asc(questionOption.sortOrder));
  const answers = await db
    .select()
    .from(questionAnswer)
    .where(eq(questionAnswer.questionId, questionId));
  const hints = await db
    .select()
    .from(questionHint)
    .where(eq(questionHint.questionId, questionId))
    .orderBy(asc(questionHint.sortOrder));

  const [{ value: maxVersion }] = await db
    .select({
      value: sql<number>`coalesce(max(${questionVersion.version}), 0)`.mapWith(
        Number,
      ),
    })
    .from(questionVersion)
    .where(eq(questionVersion.questionId, questionId));

  await db.insert(questionVersion).values({
    id: crypto.randomUUID(),
    questionId,
    version: maxVersion + 1,
    snapshot: JSON.stringify({ question: q, options, answers, hints }),
    editorId,
    createdAt: new Date(),
  });
}

export async function listQuestionVersions(
  env: CloudflareBindings,
  questionId: string,
) {
  const db = getDb(env);
  return db
    .select({
      id: questionVersion.id,
      version: questionVersion.version,
      editorId: questionVersion.editorId,
      createdAt: questionVersion.createdAt,
    })
    .from(questionVersion)
    .where(eq(questionVersion.questionId, questionId))
    .orderBy(desc(questionVersion.version));
}

export async function getQuestionVersion(
  env: CloudflareBindings,
  questionId: string,
  version: number,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(questionVersion)
    .where(
      and(
        eq(questionVersion.questionId, questionId),
        eq(questionVersion.version, version),
      ),
    )
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    snapshot: JSON.parse(row.snapshot) as unknown,
  };
}

export type DiffToken = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

export function computeTokenDiff(
  oldText: string = "",
  newText: string = "",
): DiffToken[] {
  if (oldText === newText) {
    return oldText ? [{ value: oldText, added: false, removed: false }] : [];
  }

  const tokenize = (str: string): string[] =>
    str.match(/[\w]+|[^\w\s]+|\s+/g) || (str ? [str] : []);
  const A = tokenize(oldText);
  const B = tokenize(newText);
  const m = A.length;
  const n = B.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (A[i] === B[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const rawTokens: DiffToken[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1]) {
      rawTokens.push({ value: A[i - 1], added: false, removed: false });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawTokens.push({ value: B[j - 1], added: true, removed: false });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawTokens.push({ value: A[i - 1], added: false, removed: true });
      i--;
    }
  }
  rawTokens.reverse();

  const coalesced: DiffToken[] = [];
  for (const token of rawTokens) {
    const last = coalesced[coalesced.length - 1];
    if (
      last &&
      Boolean(last.added) === Boolean(token.added) &&
      Boolean(last.removed) === Boolean(token.removed)
    ) {
      last.value += token.value;
    } else {
      coalesced.push({ ...token });
    }
  }

  return coalesced;
}

export async function getQuestionVersionDiff(
  env: CloudflareBindings,
  questionId: string,
  v1Num: number,
  v2Num: number,
) {
  const v1Row = await getQuestionVersion(env, questionId, v1Num);
  const v2Row = await getQuestionVersion(env, questionId, v2Num);

  if (!v1Row || !v2Row) {
    return null;
  }

  const snap1 = (v1Row.snapshot || {}) as Record<string, unknown>;
  const snap2 = (v2Row.snapshot || {}) as Record<string, unknown>;

  const q1 = (snap1.question || {}) as Record<string, unknown>;
  const q2 = (snap2.question || {}) as Record<string, unknown>;

  const title1 = String(q1.title || "");
  const title2 = String(q2.title || "");

  const diffTitle = {
    old: title1,
    new: title2,
    changed: title1 !== title2,
  };

  const diffDiff = {
    old: String(q1.difficulty || ""),
    new: String(q2.difficulty || ""),
    changed: String(q1.difficulty || "") !== String(q2.difficulty || ""),
  };

  const promptDiff = computeTokenDiff(
    String(q1.prompt || ""),
    String(q2.prompt || ""),
  );
  const explanationDiff = computeTokenDiff(
    String(q1.explanation || ""),
    String(q2.explanation || ""),
  );
  const codeSnippetDiff =
    q1.codeSnippet || q2.codeSnippet
      ? computeTokenDiff(
          String(q1.codeSnippet || ""),
          String(q2.codeSnippet || ""),
        )
      : undefined;

  return {
    questionId,
    v1: v1Num,
    v2: v2Num,
    diff: {
      title: diffTitle,
      difficulty: diffDiff,
      prompt: promptDiff,
      explanation: explanationDiff,
      codeSnippet: codeSnippetDiff,
    },
  };
}


export async function getAuthorReputation(
  env: CloudflareBindings,
  authorId: string,
) {
  const db = getDb(env);
  const [author] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, authorId))
    .limit(1);
  if (!author) return null;

  const [approved] = await db
    .select({ value: count() })
    .from(question)
    .where(
      and(eq(question.authorId, authorId), eq(question.status, "approved")),
    );

  const [followers] = await db
    .select({ value: count() })
    .from(authorFollow)
    .where(eq(authorFollow.authorId, authorId));

  const authored = await db
    .select({ id: question.id })
    .from(question)
    .where(
      and(eq(question.authorId, authorId), eq(question.status, "approved")),
    );
  const authoredIds = authored.map((q) => q.id);

  let learnerCorrect = 0;
  let learnerAttempts = 0;
  if (authoredIds.length > 0) {
    const [stats] = await db
      .select({
        attempts: count(attempt.id),
        correct: sql<number>`cast(sum(case when ${attempt.isCorrect} then 1 else 0 end) as int)`.mapWith(
          Number,
        ),
      })
      .from(attempt)
      .where(inArray(attempt.questionId, authoredIds));
    learnerAttempts = Number(stats?.attempts ?? 0);
    learnerCorrect = Number(stats?.correct ?? 0);
  }

  const score =
    Number(approved?.value ?? 0) * 10 +
    Number(followers?.value ?? 0) * 3 +
    Math.floor(learnerCorrect / 5);

  return {
    authorId: author.id,
    name: author.name,
    approvedQuestionCount: Number(approved?.value ?? 0),
    followerCount: Number(followers?.value ?? 0),
    learnerAttempts,
    learnerCorrect,
    reputationScore: score,
  };
}

export async function getQuestionAuthorMeta(
  env: CloudflareBindings,
  questionId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select({
      authorId: question.authorId,
      authorName: user.name,
    })
    .from(question)
    .innerJoin(user, eq(user.id, question.authorId))
    .where(eq(question.id, questionId))
    .limit(1);
  return row ?? null;
}
