import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
  doublePrecision,
  date,
  type AnyPgColumn,
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
    prerequisiteTopicId: text("prerequisite_topic_id").references(
      (): AnyPgColumn => topic.id,
      { onDelete: "set null" },
    ),
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
    whyWrong: text("why_wrong"),
    workedSolution: text("worked_solution"),
    diagramMarkdown: text("diagram_markdown"),
    relatedQuestionId: text("related_question_id").references(
      (): AnyPgColumn => question.id,
      { onDelete: "set null" },
    ),
    similarQuestionId: text("similar_question_id").references(
      (): AnyPgColumn => question.id,
      { onDelete: "set null" },
    ),
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

export const attempt = pgTable(
  "attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    booleanValue: boolean("boolean_value"),
    isCorrect: boolean("is_correct").notNull(),
    confidence: integer("confidence"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attempt_userId_idx").on(table.userId),
    index("attempt_questionId_idx").on(table.questionId),
    uniqueIndex("attempt_user_question_uidx").on(table.userId, table.questionId),
  ],
);

export const attemptOption = pgTable(
  "attempt_option",
  {
    id: text("id").primaryKey(),
    attemptId: text("attempt_id")
      .notNull()
      .references(() => attempt.id, { onDelete: "cascade" }),
    optionId: text("option_id")
      .notNull()
      .references(() => questionOption.id, { onDelete: "cascade" }),
  },
  (table) => [index("attempt_option_attemptId_idx").on(table.attemptId)],
);

export const attemptRelations = relations(attempt, ({ one, many }) => ({
  user: one(user, {
    fields: [attempt.userId],
    references: [user.id],
  }),
  question: one(question, {
    fields: [attempt.questionId],
    references: [question.id],
  }),
  selectedOptions: many(attemptOption),
}));

export const attemptOptionRelations = relations(attemptOption, ({ one }) => ({
  attempt: one(attempt, {
    fields: [attemptOption.attemptId],
    references: [attempt.id],
  }),
  option: one(questionOption, {
    fields: [attemptOption.optionId],
    references: [questionOption.id],
  }),
}));
export const learningPath = pgTable("learning_path", {
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
});

export const learningPathTopic = pgTable(
  "learning_path_topic",
  {
    id: text("id").primaryKey(),
    pathId: text("path_id")
      .notNull()
      .references(() => learningPath.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topic.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("learning_path_topic_pathId_idx").on(table.pathId),
    uniqueIndex("learning_path_topic_uidx").on(table.pathId, table.topicId),
  ],
);

export const userLearning = pgTable("user_learning", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  dailyGoal: integer("daily_goal").default(3).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActiveDate: date("last_active_date"),
  lastQuestionId: text("last_question_id").references(() => question.id, {
    onDelete: "set null",
  }),
  lastTopicId: text("last_topic_id").references(() => topic.id, {
    onDelete: "set null",
  }),
  lastPathId: text("last_path_id").references(() => learningPath.id, {
    onDelete: "set null",
  }),
  lastActivityAt: timestamp("last_activity_at"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const bookmark = pgTable(
  "bookmark",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bookmark_user_question_uidx").on(
      table.userId,
      table.questionId,
    ),
    index("bookmark_userId_idx").on(table.userId),
  ],
);

export const spacedReview = pgTable(
  "spaced_review",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    dueAt: timestamp("due_at").notNull(),
    intervalDays: integer("interval_days").default(1).notNull(),
    easeFactor: doublePrecision("ease_factor").default(2.5).notNull(),
    repetitions: integer("repetitions").default(0).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("spaced_review_user_question_uidx").on(
      table.userId,
      table.questionId,
    ),
    index("spaced_review_dueAt_idx").on(table.dueAt),
    index("spaced_review_userId_idx").on(table.userId),
  ],
);

export const learningPathRelations = relations(learningPath, ({ many }) => ({
  topics: many(learningPathTopic),
}));

export const learningPathTopicRelations = relations(
  learningPathTopic,
  ({ one }) => ({
    path: one(learningPath, {
      fields: [learningPathTopic.pathId],
      references: [learningPath.id],
    }),
    topic: one(topic, {
      fields: [learningPathTopic.topicId],
      references: [topic.id],
    }),
  }),
);

export const dailyChallenge = pgTable(
  "daily_challenge",
  {
    id: text("id").primaryKey(),
    challengeDate: date("challenge_date").notNull().unique(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("daily_challenge_date_idx").on(table.challengeDate)],
);

export const achievement = pgTable("achievement", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievement = pgTable(
  "user_achievement",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievement.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_achievement_uidx").on(table.userId, table.achievementId),
    index("user_achievement_userId_idx").on(table.userId),
  ],
);

export const questionComment = pgTable(
  "question_comment",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("question_comment_questionId_idx").on(table.questionId),
    index("question_comment_status_idx").on(table.status),
  ],
);

export const authorFollow = pgTable(
  "author_follow",
  {
    id: text("id").primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("author_follow_uidx").on(table.followerId, table.authorId),
    index("author_follow_followerId_idx").on(table.followerId),
  ],
);

export const questionSet = pgTable("question_set", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const questionSetItem = pgTable(
  "question_set_item",
  {
    id: text("id").primaryKey(),
    setId: text("set_id")
      .notNull()
      .references(() => questionSet.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("question_set_item_uidx").on(table.setId, table.questionId),
    index("question_set_item_setId_idx").on(table.setId),
  ],
);

export const questionHint = pgTable(
  "question_hint",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    body: text("body").notNull(),
  },
  (table) => [index("question_hint_questionId_idx").on(table.questionId)],
);

export const glossaryTerm = pgTable(
  "glossary_term",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    term: text("term").notNull(),
    definition: text("definition").notNull(),
    topicId: text("topic_id").references(() => topic.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("glossary_term_topicId_idx").on(table.topicId)],
);

export const questionReport = pgTable(
  "question_report",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("question_report_questionId_idx").on(table.questionId),
    index("question_report_status_idx").on(table.status),
  ],
);

export const questionVersion = pgTable(
  "question_version",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: text("snapshot").notNull(),
    editorId: text("editor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("question_version_uidx").on(table.questionId, table.version),
    index("question_version_questionId_idx").on(table.questionId),
  ],
);

export const sandboxSubmission = pgTable(
  "sandbox_submission",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceCode: text("source_code"),
    submittedOutput: text("submitted_output"),
    isCorrect: boolean("is_correct"),
    feedback: text("feedback"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("sandbox_submission_questionId_idx").on(table.questionId)],
);

export const explanationVote = pgTable(
  "explanation_vote",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    helpful: boolean("helpful").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("explanation_vote_uidx").on(table.questionId, table.userId),
    index("explanation_vote_questionId_idx").on(table.questionId),
  ],
);

export const questionDuplicateFlag = pgTable(
  "question_duplicate_flag",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    similarQuestionId: text("similar_question_id").references(() => question.id, {
      onDelete: "set null",
    }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    note: text("note"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("question_duplicate_flag_status_idx").on(table.status),
    index("question_duplicate_flag_questionId_idx").on(table.questionId),
  ],
);

export const uiEvent = pgTable(
  "ui_event",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    sessionKey: text("session_key"),
    route: text("route"),
    questionId: text("question_id").references(() => question.id, {
      onDelete: "set null",
    }),
    eventName: text("event_name").notNull(),
    targetId: text("target_id"),
    durationMs: integer("duration_ms"),
    meta: text("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ui_event_userId_idx").on(table.userId),
    index("ui_event_eventName_idx").on(table.eventName),
    index("ui_event_createdAt_idx").on(table.createdAt),
    index("ui_event_questionId_idx").on(table.questionId),
  ],
);
