import { z } from "zod";

export const explanationVoteSchema = z.object({
  helpful: z.boolean(),
});

export const duplicateFlagSchema = z.object({
  similarQuestionId: z.string().optional(),
  note: z.string().max(2000).optional(),
});

export const uiEventSchema = z.object({
  eventName: z.string().min(1).max(80),
  route: z.string().max(300).optional(),
  questionId: z.string().optional(),
  targetId: z.string().max(120).optional(),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  sessionKey: z.string().max(120).optional(),
});

export const ingestUiEventsSchema = z.object({
  events: z.array(uiEventSchema).min(1).max(50),
});

export const dailyGoalSchema = z.object({
  dailyGoal: z.number().int().min(1).max(50),
});

export const bookmarkBodySchema = z.object({
  questionId: z.string().min(1),
});

export type ExplanationVoteInput = z.infer<typeof explanationVoteSchema>;
export type DuplicateFlagInput = z.infer<typeof duplicateFlagSchema>;
export type UiEventInput = z.infer<typeof uiEventSchema>;
export type IngestUiEventsInput = z.infer<typeof ingestUiEventsSchema>;
export type DailyGoalInput = z.infer<typeof dailyGoalSchema>;
export type BookmarkBodyInput = z.infer<typeof bookmarkBodySchema>;

export type TopicMastery = {
  topicId: string;
  title: string;
  description: string | null;
  prerequisiteTopicId: string | null;
  approvedCount: number;
  attempted: number;
  correct: number;
  remaining: number;
  masteryPercent: number;
};

export type ContinueState = {
  lastQuestionId: string | null;
  lastQuestionTitle: string | null;
  lastTopicId: string | null;
  lastTopicTitle: string | null;
  lastPathId: string | null;
  lastPathTitle: string | null;
  lastActivityAt?: string | Date | null;
  dueCount: number;
};

export type WeakDrillItem = {
  questionId: string;
  title: string;
  type: string;
  difficulty: string;
  topicId: string;
  topicTitle: string;
  attemptedAt?: string | Date;
};

export type ExplanationVoteStats = {
  helpful: number;
  unhelpful: number;
  mine: boolean | null;
};

export type PrerequisiteGate = {
  blocked: false;
  warn?: boolean;
  prerequisite: { id: string; title: string } | null;
  masteryPercent?: number;
};

export type PlaylistPlay = {
  set: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
  };
  items: {
    questionId: string;
    title: string;
    type: string;
    difficulty: string;
    attempted: boolean;
  }[];
  nextQuestionId: string | null;
};

export type LearningStats = {
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string | null;
  todayAttemptCount: number;
};

export type QueueItem = {
  questionId: string;
  title: string;
  type: string;
  difficulty: string;
  dueAt?: string;
  attemptedAt?: string;
};
