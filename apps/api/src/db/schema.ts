import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const device = pgTable(
  "device",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    platform: text("platform").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    browserName: text("browser_name"),
    browserVersion: text("browser_version"),
    osName: text("os_name"),
    osVersion: text("os_version"),
    deviceType: text("device_type"),
    country: text("country"),
    city: text("city"),
    appVersion: text("app_version"),
    fingerprint: text("fingerprint").notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("device_userId_idx").on(table.userId),
    uniqueIndex("device_user_fingerprint_uidx").on(
      table.userId,
      table.fingerprint,
    ),
  ],
);

export const requestLog = pgTable(
  "request_log",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    requestId: text("request_id").notNull(),
    platform: text("platform").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    statusCode: integer("status_code").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    userId: text("user_id"),
    deviceId: text("device_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    browserName: text("browser_name"),
    browserVersion: text("browser_version"),
    osName: text("os_name"),
    osVersion: text("os_version"),
    deviceType: text("device_type"),
    country: text("country"),
    city: text("city"),
    appVersion: text("app_version"),
  },
  (table) => [
    index("request_log_createdAt_idx").on(table.createdAt),
    index("request_log_userId_createdAt_idx").on(table.userId, table.createdAt),
    index("request_log_platform_createdAt_idx").on(
      table.platform,
      table.createdAt,
    ),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  devices: many(device),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const deviceRelations = relations(device, ({ one }) => ({
  user: one(user, {
    fields: [device.userId],
    references: [user.id],
  }),
  session: one(session, {
    fields: [device.sessionId],
    references: [session.id],
  }),
}));

export const topic = pgTable(
  "topic",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("topic_sortOrder_idx").on(table.sortOrder)],
);

export const question = pgTable(
  "question",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id")
      .notNull()
      .references(() => topic.id, { onDelete: "restrict" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("draft"),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    explanation: text("explanation").notNull(),
    difficulty: text("difficulty").notNull().default("beginner"),
    codeSnippet: text("code_snippet"),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewNote: text("review_note"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("question_authorId_idx").on(table.authorId),
    index("question_status_idx").on(table.status),
    index("question_topicId_idx").on(table.topicId),
  ],
);

export const questionOption = pgTable(
  "question_option",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    body: text("body").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("question_option_questionId_idx").on(table.questionId)],
);

export const questionAnswer = pgTable(
  "question_answer",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    optionId: text("option_id").references(() => questionOption.id, {
      onDelete: "cascade",
    }),
    booleanValue: boolean("boolean_value"),
    isCorrect: boolean("is_correct").default(true).notNull(),
  },
  (table) => [index("question_answer_questionId_idx").on(table.questionId)],
);

export const questionReview = pgTable(
  "question_review",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("question_review_questionId_idx").on(table.questionId)],
);

export const topicRelations = relations(topic, ({ many }) => ({
  questions: many(question),
}));

export const questionRelations = relations(question, ({ one, many }) => ({
  topic: one(topic, {
    fields: [question.topicId],
    references: [topic.id],
  }),
  author: one(user, {
    fields: [question.authorId],
    references: [user.id],
    relationName: "question_author",
  }),
  reviewer: one(user, {
    fields: [question.reviewerId],
    references: [user.id],
    relationName: "question_reviewer",
  }),
  options: many(questionOption),
  answers: many(questionAnswer),
  reviews: many(questionReview),
}));

export const questionOptionRelations = relations(
  questionOption,
  ({ one, many }) => ({
    question: one(question, {
      fields: [questionOption.questionId],
      references: [question.id],
    }),
    answers: many(questionAnswer),
  }),
);

export const questionAnswerRelations = relations(questionAnswer, ({ one }) => ({
  question: one(question, {
    fields: [questionAnswer.questionId],
    references: [question.id],
  }),
  option: one(questionOption, {
    fields: [questionAnswer.optionId],
    references: [questionOption.id],
  }),
}));

export const questionReviewRelations = relations(questionReview, ({ one }) => ({
  question: one(question, {
    fields: [questionReview.questionId],
    references: [question.id],
  }),
  reviewer: one(user, {
    fields: [questionReview.reviewerId],
    references: [user.id],
  }),
}));