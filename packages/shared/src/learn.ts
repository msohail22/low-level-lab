import { z } from "zod";

export const submitAttemptSchema = z
  .object({
    optionIds: z.array(z.string().min(1)).default([]),
    booleanValue: z.boolean().optional(),
    confidence: z.number().int().min(1).max(3).optional(),
    timedMode: z.boolean().optional(),
    elapsedMs: z.number().int().min(0).max(3_600_000).optional(),
  })
  .superRefine((data, ctx) => {
    const hasOptions = data.optionIds.length > 0;
    const hasBool = typeof data.booleanValue === "boolean";
    if (hasOptions === hasBool) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either optionIds or booleanValue (not both/neither)",
      });
    }
  });

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

export type AttemptResult = {
  attemptId?: string;
  isCorrect: boolean;
  explanation: string;
  whyWrong?: string | null;
  workedSolution?: string | null;
  relatedQuestionId?: string | null;
  correctBooleanValue: boolean | null;
  correctOptionIds: string[];
  selectedOptionIds?: string[];
  booleanValue?: boolean | null;
  dailyChallengeCorrect?: boolean;
  confidence?: number | null;
  reattempted?: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  email?: string;
  correctCount: number;
  attemptCount: number;
};

export type LearnTopic = {
  id: string;
  title: string;
  description: string | null;
  approvedCount: number;
  slug?: string;
};

export type TopicQuestionListItem = {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  publishedAt?: string | Date | null;
  attempted: boolean;
  isCorrect: boolean | null;
};
