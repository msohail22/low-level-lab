import { and, asc, count, desc, eq } from "drizzle-orm";

import { createDb } from "../db/index.ts";
import {
  question,
  questionAnswer,
  questionOption,
  questionReview,
  topic,
} from "../db/schema.ts";
import type { CreateQuestionInput } from "./schema.ts";

export function getDb(env: CloudflareBindings) {
  return createDb(env.HYPERDRIVE);
}

export async function listTopics(env: CloudflareBindings) {
  const db = getDb(env);
  return db.select().from(topic).orderBy(asc(topic.sortOrder));
}

export async function listMyQuestions(
  env: CloudflareBindings,
  userId: string,
  filters?: { type?: string; status?: string },
) {
  const db = getDb(env);
  const conditions = [eq(question.authorId, userId)];
  if (filters?.type) conditions.push(eq(question.type, filters.type));
  if (filters?.status) conditions.push(eq(question.status, filters.status));

  return db
    .select()
    .from(question)
    .where(and(...conditions))
    .orderBy(desc(question.createdAt));
}

export async function listPendingQuestions(
  env: CloudflareBindings,
  filters?: { type?: string; difficulty?: string },
) {
  const db = getDb(env);
  const conditions = [eq(question.status, "pending")];
  if (filters?.type) conditions.push(eq(question.type, filters.type));
  if (filters?.difficulty) {
    conditions.push(eq(question.difficulty, filters.difficulty));
  }

  return db
    .select()
    .from(question)
    .where(and(...conditions))
    .orderBy(asc(question.createdAt));
}

export async function getAdminStats(env: CloudflareBindings) {
  const db = getDb(env);
  const [pending] = await db
    .select({ value: count() })
    .from(question)
    .where(eq(question.status, "pending"));
  const [approved] = await db
    .select({ value: count() })
    .from(question)
    .where(eq(question.status, "approved"));
  const topics = await db.select().from(topic);

  return {
    pendingCount: Number(pending?.value ?? 0),
    approvedCount: Number(approved?.value ?? 0),
    topicCount: topics.length,
  };
}

export async function getQuestionBundle(
  env: CloudflareBindings,
  questionId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1);
  if (!row) return null;

  const options = await db
    .select()
    .from(questionOption)
    .where(eq(questionOption.questionId, questionId))
    .orderBy(asc(questionOption.sortOrder));

  const answers = await db
    .select()
    .from(questionAnswer)
    .where(eq(questionAnswer.questionId, questionId));

  return { question: row, options, answers };
}

export async function createQuestionWithParts(
  env: CloudflareBindings,
  authorId: string,
  input: CreateQuestionInput,
) {
  const db = getDb(env);
  const questionId = crypto.randomUUID();
  const now = new Date();

  const [topicRow] = await db
    .select()
    .from(topic)
    .where(eq(topic.id, input.topicId))
    .limit(1);
  if (!topicRow) {
    throw new Error("TOPIC_NOT_FOUND");
  }

  await db.insert(question).values({
    id: questionId,
    topicId: input.topicId,
    type: input.type,
    status: input.status,
    title: input.title,
    prompt: input.prompt,
    explanation: input.explanation,
    whyWrong: input.whyWrong ?? null,
    workedSolution: input.workedSolution ?? null,
    diagramMarkdown: input.diagramMarkdown ?? null,
    relatedQuestionId: input.relatedQuestionId ?? null,
    similarQuestionId: input.similarQuestionId ?? null,
    difficulty: input.difficulty,
    codeSnippet: input.codeSnippet ?? null,
    authorId,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  });

  if (input.type === "true_false") {
    await db.insert(questionAnswer).values({
      id: crypto.randomUUID(),
      questionId,
      optionId: null,
      booleanValue: input.booleanAnswer!,
      isCorrect: true,
    });
  } else {
    const optionIds: { id: string; isCorrect: boolean }[] = [];
    for (const [index, opt] of input.options.entries()) {
      const optionId = crypto.randomUUID();
      optionIds.push({ id: optionId, isCorrect: Boolean(opt.isCorrect) });
      await db.insert(questionOption).values({
        id: optionId,
        questionId,
        label: opt.label,
        body: opt.body,
        sortOrder: index,
      });
    }
    for (const opt of optionIds.filter((o) => o.isCorrect)) {
      await db.insert(questionAnswer).values({
        id: crypto.randomUUID(),
        questionId,
        optionId: opt.id,
        booleanValue: null,
        isCorrect: true,
      });
    }
  }

  if (input.hints?.length) {
    const { insertHints, snapshotQuestionVersion } = await import(
      "../learn/platform.ts"
    );
    await insertHints(env, questionId, input.hints);
    await snapshotQuestionVersion(env, questionId, authorId);
  } else {
    const { snapshotQuestionVersion } = await import("../learn/platform.ts");
    await snapshotQuestionVersion(env, questionId, authorId);
  }

  return questionId;
}

export async function submitQuestion(
  env: CloudflareBindings,
  questionId: string,
  authorId: string,
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(question)
    .where(eq(question.id, questionId))
    .limit(1);

  if (!row) return { error: "NOT_FOUND" as const };
  if (row.authorId !== authorId) return { error: "FORBIDDEN" as const };
  if (row.status !== "draft" && row.status !== "rejected") {
    return { error: "INVALID_STATUS" as const };
  }

  await db
    .update(question)
    .set({ status: "pending", reviewNote: null, updatedAt: new Date() })
    .where(eq(question.id, questionId));

  return { error: null };
}

export async function reviewQuestion(
  env: CloudflareBindings,
  opts: {
    questionId: string;
    reviewerId: string;
    action: "approve" | "reject";
    note?: string;
  },
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(question)
    .where(eq(question.id, opts.questionId))
    .limit(1);

  if (!row) return { error: "NOT_FOUND" as const };
  if (row.status !== "pending") return { error: "INVALID_STATUS" as const };

  const now = new Date();
  const status = opts.action === "approve" ? "approved" : "rejected";

  await db.insert(questionReview).values({
    id: crypto.randomUUID(),
    questionId: opts.questionId,
    reviewerId: opts.reviewerId,
    action: opts.action,
    note: opts.note ?? null,
    createdAt: now,
  });

  await db
    .update(question)
    .set({
      status,
      reviewerId: opts.reviewerId,
      reviewNote: opts.note ?? null,
      publishedAt: opts.action === "approve" ? now : null,
      updatedAt: now,
    })
    .where(eq(question.id, opts.questionId));

  const { snapshotQuestionVersion, evaluateAchievements } = await import(
    "../learn/platform.ts"
  );
  await snapshotQuestionVersion(env, opts.questionId, opts.reviewerId);
  if (opts.action === "approve") {
    await evaluateAchievements(env, row.authorId);
  }

  return { error: null };
}

export async function updateQuestionContent(
  env: CloudflareBindings,
  opts: {
    questionId: string;
    editorId: string;
    isReviewer: boolean;
    patch: {
      title?: string;
      prompt?: string;
      explanation?: string;
      whyWrong?: string | null;
      workedSolution?: string | null;
      diagramMarkdown?: string | null;
      difficulty?: string;
      codeSnippet?: string | null;
      relatedQuestionId?: string | null;
      similarQuestionId?: string | null;
      requireReReview?: boolean;
    };
  },
) {
  const db = getDb(env);
  const [row] = await db
    .select()
    .from(question)
    .where(eq(question.id, opts.questionId))
    .limit(1);
  if (!row) return { error: "NOT_FOUND" as const };
  if (row.authorId !== opts.editorId && !opts.isReviewer) {
    return { error: "FORBIDDEN" as const };
  }

  const now = new Date();
  const wasApproved = row.status === "approved";
  const needsReReview = Boolean(opts.patch.requireReReview) && wasApproved;

  await db
    .update(question)
    .set({
      title: opts.patch.title ?? row.title,
      prompt: opts.patch.prompt ?? row.prompt,
      explanation: opts.patch.explanation ?? row.explanation,
      whyWrong:
        opts.patch.whyWrong !== undefined ? opts.patch.whyWrong : row.whyWrong,
      workedSolution:
        opts.patch.workedSolution !== undefined
          ? opts.patch.workedSolution
          : row.workedSolution,
      diagramMarkdown:
        opts.patch.diagramMarkdown !== undefined
          ? opts.patch.diagramMarkdown
          : row.diagramMarkdown,
      difficulty: opts.patch.difficulty ?? row.difficulty,
      codeSnippet:
        opts.patch.codeSnippet !== undefined
          ? opts.patch.codeSnippet
          : row.codeSnippet,
      relatedQuestionId:
        opts.patch.relatedQuestionId !== undefined
          ? opts.patch.relatedQuestionId
          : row.relatedQuestionId,
      similarQuestionId:
        opts.patch.similarQuestionId !== undefined
          ? opts.patch.similarQuestionId
          : row.similarQuestionId,
      status: needsReReview ? "pending" : row.status,
      publishedAt: needsReReview ? null : row.publishedAt,
      updatedAt: now,
    })
    .where(eq(question.id, opts.questionId));

  const { snapshotQuestionVersion } = await import("../learn/platform.ts");
  await snapshotQuestionVersion(env, opts.questionId, opts.editorId);

  return { error: null, status: needsReReview ? "pending" : row.status };
}
