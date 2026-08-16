import { buildSchema } from "graphql";

export const typeDefs = `
  type LeaderboardEntry {
    userId: String!
    name: String!
    score: Int!
    streak: Int!
    updatedAt: String
  }

  type PathStat {
    path: String!
    count: Int!
  }

  type TelemetrySummary {
    totalRequests: Int!
    avgLatencyMs: Float!
    errorCount: Int!
    activeDevices: Int!
    uiEventsCount: Int!
    topPaths: [PathStat!]!
  }

  type QuestionOption {
    id: String!
    label: String!
    body: String!
    sortOrder: Int!
  }

  type Question {
    id: String!
    topicId: String!
    type: String!
    status: String!
    title: String!
    prompt: String!
    explanation: String!
    whyWrong: String
    difficulty: String!
    codeSnippet: String
    publishedAt: String
    options: [QuestionOption!]
  }

  type LearningStats {
    dailyGoal: Int!
    currentStreak: Int!
    longestStreak: Int!
    lastActiveDate: String
    dueReviewCount: Int!
    bookmarkCount: Int!
  }

  type UserProfile {
    id: String!
    name: String!
    email: String!
    image: String
    roles: Roles!
    stats: LearningStats
  }

  type Roles {
    reviewer: Boolean!
    admin: Boolean!
  }

  type AttemptResult {
    id: String!
    isCorrect: Boolean!
    confidence: Int
  }

  type BookmarkResult {
    bookmarked: Boolean!
  }

  input QuestionInput {
    topicId: String!
    type: String!
    title: String!
    prompt: String!
    explanation: String!
    whyWrong: String
    difficulty: String
    codeSnippet: String
  }

  type Query {
    leaderboard(limit: Int): [LeaderboardEntry!]!
    telemetry(period: String): TelemetrySummary!
    questions(topicId: String, status: String, limit: Int): [Question!]!
    question(id: String!): Question
    me: UserProfile
  }

  type Mutation {
    submitAttempt(questionId: String!, selectedOptionIds: [String!], booleanValue: Boolean): AttemptResult!
    contributeQuestion(input: QuestionInput!): Question!
    toggleBookmark(questionId: String!): BookmarkResult!
  }
`;

export const schema = buildSchema(typeDefs);
