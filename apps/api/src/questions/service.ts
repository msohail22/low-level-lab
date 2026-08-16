import { asc, desc, eq } from "drizzle-orm";

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

export async function listMyQuestions(env: CloudflareBindings, userId: string) {
  const db = getDb(env);
  return db
    .select()
    .from(question)
    .where(eq(question.authorId, userId))
    .orderBy(desc(question.createdAt));
}

export async function listPendingQuestions(env: CloudflareBindings) {
  const db = getDb(env);
  return db
    .select()
    .from(question)
    .where(eq(question.status, "pending"))
    .orderBy(asc(question.createdAt));
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

  return { error: null };
}
