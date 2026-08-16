import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { createDb } from "../db/index.ts";
import {
  attempt,
  attemptOption,
  question,
  questionAnswer,
  questionOption,
  topic,
  user,
} from "../db/schema.ts";
import type { SubmitAttemptInput } from "./schema.ts";

function getDb(env: CloudflareBindings) {
  return createDb(env.HYPERDRIVE);
}

export async function listLearnTopics(env: CloudflareBindings) {
  const db = getDb(env);
  const topics = await db.select().from(topic).orderBy(asc(topic.sortOrder));

  const counts = await db
    .select({
      topicId: question.topicId,
      approvedCount: count(question.id),
    })
    .from(question)
    .where(eq(question.status, "approved"))
    .groupBy(question.topicId);

  const countMap = new Map(
    counts.map((row) => [row.topicId, Number(row.approvedCount)]),
  );

  return topics.map((t) => ({
    ...t,
    approvedCount: countMap.get(t.id) ?? 0,
  }));
}

export async function listApprovedQuestionsForTopic(
  env: CloudflareBindings,
  topicId: string,
  userId?: string,
  filters?: {
    type?: string;
    difficulty?: string;
    attempted?: "all" | "yes" | "no";
  },
) {
  const db = getDb(env);
  const conditions = [
    eq(question.topicId, topicId),
    eq(question.status, "approved"),
  ];
  if (filters?.type) conditions.push(eq(question.type, filters.type));
  if (filters?.difficulty) {
    conditions.push(eq(question.difficulty, filters.difficulty));
  }

  const rows = await db
    .select({
      id: question.id,
      title: question.title,
      type: question.type,
      difficulty: question.difficulty,
      publishedAt: question.publishedAt,
    })
    .from(question)
    .where(and(...conditions))
    .orderBy(asc(question.publishedAt));

  if (!userId) {
    return rows.map((r) => ({
      ...r,
      attempted: false,
      isCorrect: null as boolean | null,
    }));
  }

  const attempts = await db
    .select({
      questionId: attempt.questionId,
      isCorrect: attempt.isCorrect,
    })
    .from(attempt)
    .where(eq(attempt.userId, userId));

  const attemptMap = new Map(
    attempts.map((a) => [a.questionId, a.isCorrect]),
  );

  let mapped = rows.map((r) => ({
    ...r,
    attempted: attemptMap.has(r.id),
    isCorrect: attemptMap.get(r.id) ?? null,
  }));

  if (filters?.attempted === "yes") {
    mapped = mapped.filter((r) => r.attempted);
  } else if (filters?.attempted === "no") {
    mapped = mapped.filter((r) => !r.attempted);
  }

  return mapped;
}

export async function getPracticeQuestion(
  env: CloudflareBindings,
  questionId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, questionId), eq(question.status, "approved")))
    .limit(1);

  if (!row) return null;

  const options = await db
    .select({
      id: questionOption.id,
      label: questionOption.label,
      body: questionOption.body,
      sortOrder: questionOption.sortOrder,
    })
    .from(questionOption)
    .where(eq(questionOption.questionId, questionId))
    .orderBy(asc(questionOption.sortOrder));

  const { getHintCount, getQuestionAuthorMeta } = await import("./platform.ts");
  const { getCommunityCalibration } = await import("./study.ts");
  const hintCount = await getHintCount(env, questionId);
  const author = await getQuestionAuthorMeta(env, questionId);
  const calibration = await getCommunityCalibration(env, questionId);

  return {
    id: row.id,
    topicId: row.topicId,
    type: row.type,
    title: row.title,
    prompt: row.prompt,
    difficulty: row.difficulty,
    codeSnippet: row.codeSnippet,
    diagramMarkdown: row.diagramMarkdown,
    relatedQuestionId: row.relatedQuestionId,
    similarQuestionId: row.similarQuestionId,
    hintCount,
    authorId: author?.authorId ?? row.authorId,
    authorName: author?.authorName ?? null,
    calibration,
    options,
  };
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

export async function submitAttempt(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
  input: SubmitAttemptInput,
) {
  const db = getDb(env);

  const [existing] = await db
    .select()
    .from(attempt)
    .where(and(eq(attempt.userId, userId), eq(attempt.questionId, questionId)))
    .limit(1);

  const [row] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, questionId), eq(question.status, "approved")))
    .limit(1);

  if (!row) return { error: "NOT_FOUND" as const };

  const answers = await db
    .select()
    .from(questionAnswer)
    .where(
      and(
        eq(questionAnswer.questionId, questionId),
        eq(questionAnswer.isCorrect, true),
      ),
    );

  let isCorrect = false;
  if (row.type === "true_false") {
    const expected = answers[0]?.booleanValue;
    isCorrect =
      typeof expected === "boolean" && expected === input.booleanValue;
  } else {
    const expected = new Set(
      answers
        .map((a) => a.optionId)
        .filter((id): id is string => typeof id === "string"),
    );
    const selected = new Set(input.optionIds);
    isCorrect = setsEqual(expected, selected);
  }

  const now = new Date();
  let attemptId = existing?.id ?? crypto.randomUUID();

  if (existing) {
    await db
      .update(attempt)
      .set({
        booleanValue:
          row.type === "true_false" ? (input.booleanValue ?? null) : null,
        isCorrect,
        confidence: input.confidence ?? null,
        createdAt: now,
      })
      .where(eq(attempt.id, existing.id));
    await db
      .delete(attemptOption)
      .where(eq(attemptOption.attemptId, existing.id));
  } else {
    await db.insert(attempt).values({
      id: attemptId,
      userId,
      questionId,
      booleanValue:
        row.type === "true_false" ? (input.booleanValue ?? null) : null,
      isCorrect,
      confidence: input.confidence ?? null,
      createdAt: now,
    });
  }

  if (row.type !== "true_false") {
    for (const optionId of input.optionIds) {
      await db.insert(attemptOption).values({
        id: crypto.randomUUID(),
        attemptId,
        optionId,
      });
    }
  }

  const { recordActivityStreak, upsertSpacedReview } = await import(
    "./engagement.ts"
  );
  const { evaluateAchievements, getOrCreateDailyChallenge } = await import(
    "./platform.ts"
  );
  const { recordContinuePointer } = await import("./study.ts");
  await recordActivityStreak(env, userId);
  await upsertSpacedReview(
    env,
    userId,
    questionId,
    isCorrect,
    input.confidence,
  );
  await recordContinuePointer(env, userId, {
    questionId,
    topicId: row.topicId,
  });

  let dailyChallengeCorrect = false;
  if (isCorrect) {
    const challenge = await getOrCreateDailyChallenge(env);
    dailyChallengeCorrect = challenge?.questionId === questionId;
  }
  await evaluateAchievements(env, userId, { dailyChallengeCorrect });

  const correctOptionIds = answers
    .map((a) => a.optionId)
    .filter((id): id is string => typeof id === "string");

  return {
    error: null,
    result: {
      attemptId,
      isCorrect,
      explanation: row.explanation,
      whyWrong: isCorrect ? null : (row.whyWrong ?? null),
      workedSolution: isCorrect ? (row.workedSolution ?? null) : null,
      relatedQuestionId: row.relatedQuestionId,
      correctBooleanValue:
        row.type === "true_false" ? (answers[0]?.booleanValue ?? null) : null,
      correctOptionIds,
      reattempted: Boolean(existing),
      dailyChallengeCorrect,
      confidence: input.confidence ?? null,
    },
  };
}

export async function getLeaderboard(env: CloudflareBindings, limit = 50) {
  const db = getDb(env);

  const rows = await db
    .select({
      userId: attempt.userId,
      name: user.name,
      email: user.email,
      correctCount: sql<number>`cast(sum(case when ${attempt.isCorrect} then 1 else 0 end) as int)`.mapWith(
        Number,
      ),
      attemptCount: count(attempt.id),
    })
    .from(attempt)
    .innerJoin(user, eq(user.id, attempt.userId))
    .groupBy(attempt.userId, user.name, user.email)
    .orderBy(
      desc(
        sql`sum(case when ${attempt.isCorrect} then 1 else 0 end)`,
      ),
      asc(count(attempt.id)),
    )
    .limit(limit);

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.userId,
    name: row.name,
    email: row.email,
    correctCount: row.correctCount,
    attemptCount: Number(row.attemptCount),
  }));
}

export async function getMyAttempt(
  env: CloudflareBindings,
  userId: string,
  questionId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(attempt)
    .where(and(eq(attempt.userId, userId), eq(attempt.questionId, questionId)))
    .limit(1);

  if (!row) return null;

  const selected = await db
    .select({ optionId: attemptOption.optionId })
    .from(attemptOption)
    .where(eq(attemptOption.attemptId, row.id));

  const [q] = await db
    .select({
      explanation: question.explanation,
      whyWrong: question.whyWrong,
      workedSolution: question.workedSolution,
      relatedQuestionId: question.relatedQuestionId,
      type: question.type,
    })
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1);

  const answers = await db
    .select()
    .from(questionAnswer)
    .where(
      and(
        eq(questionAnswer.questionId, questionId),
        eq(questionAnswer.isCorrect, true),
      ),
    );

  return {
    attemptId: row.id,
    isCorrect: row.isCorrect,
    booleanValue: row.booleanValue,
    confidence: row.confidence,
    selectedOptionIds: selected.map((s) => s.optionId),
    explanation: q?.explanation ?? "",
    whyWrong: row.isCorrect ? null : (q?.whyWrong ?? null),
    workedSolution: row.isCorrect ? (q?.workedSolution ?? null) : null,
    relatedQuestionId: q?.relatedQuestionId ?? null,
    correctBooleanValue:
      q?.type === "true_false" ? (answers[0]?.booleanValue ?? null) : null,
    correctOptionIds: answers
      .map((a) => a.optionId)
      .filter((id): id is string => typeof id === "string"),
  };
}
