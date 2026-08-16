import { z } from "zod";

export const createQuestionSetSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  isPublic: z.boolean().optional(),
  questionIds: z.array(z.string().min(1)).max(100).optional(),
});

export const addSetItemSchema = z.object({
  questionId: z.string().min(1),
});

export const createCommentSchema = z.object({
  body: z.string().min(2).max(2000),
});

export const reportQuestionSchema = z.object({
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional(),
});

export const sandboxSubmitSchema = z.object({
  sourceCode: z.string().max(20000).optional(),
  submittedOutput: z.string().max(4000).optional(),
});

export type CreateQuestionSetInput = z.infer<typeof createQuestionSetSchema>;
export type AddSetItemInput = z.infer<typeof addSetItemSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ReportQuestionInput = z.infer<typeof reportQuestionSchema>;
export type SandboxSubmitInput = z.infer<typeof sandboxSubmitSchema>;

export type DailyChallenge = {
  id: string;
  challengeDate: string;
  questionId: string;
  title: string;
  type: string;
  difficulty: string;
  topicId?: string;
};

export type DailyChallengeLeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  completedAt: string | Date;
};

export type Achievement = {
  id: string;
  slug: string;
  title: string;
  description: string;
  earnedAt: string | null;
  createdAt?: string | Date;
};

export type GlossaryTerm = {
  id: string;
  slug: string;
  term: string;
  definition: string;
  topicId: string | null;
  topicTitle: string | null;
};

export type QuestionSetSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ownerId?: string;
  ownerName: string;
  createdAt?: string | Date;
};

export type QuestionSetDetail = QuestionSetSummary & {
  ownerId: string;
  isPublic?: boolean;
  items: {
    questionId: string;
    title: string;
    type: string;
    difficulty: string;
    sortOrder?: number;
    status?: string;
  }[];
};

export type QuestionComment = {
  id: string;
  body: string;
  authorName: string;
  authorId?: string;
  createdAt?: string | Date;
};

export type AuthorReputation = {
  authorId: string;
  name: string;
  approvedQuestionCount: number;
  followerCount: number;
  learnerAttempts: number;
  learnerCorrect: number;
  reputationScore: number;
};

export type FollowingFeedItem = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  authorId: string;
  authorName: string;
  publishedAt?: string | Date | null;
};

export type DiffToken = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

export type FieldValueDiff = {
  old: string;
  new: string;
  changed: boolean;
};

export type QuestionDiffResponse = {
  questionId: string;
  v1: number;
  v2: number;
  diff: {
    title: FieldValueDiff;
    difficulty: FieldValueDiff;
    prompt: DiffToken[];
    explanation: DiffToken[];
    codeSnippet?: DiffToken[];
  };
};

