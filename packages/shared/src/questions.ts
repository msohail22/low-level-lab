import { z } from "zod";

import { difficulties, questionTypes } from "./constants.ts";

const optionInput = z.object({
  label: z.string().min(1).max(8),
  body: z.string().min(1).max(2000),
  isCorrect: z.boolean().optional(),
});

export const createQuestionSchema = z
  .object({
    topicId: z.string().min(1),
    type: z.enum(questionTypes),
    title: z.string().min(3).max(200),
    prompt: z.string().min(3).max(5000),
    explanation: z.string().min(3).max(5000),
    whyWrong: z.string().max(5000).nullable().optional(),
    workedSolution: z.string().max(8000).nullable().optional(),
    diagramMarkdown: z.string().max(8000).nullable().optional(),
    relatedQuestionId: z.string().nullable().optional(),
    similarQuestionId: z.string().nullable().optional(),
    difficulty: z.enum(difficulties).default("beginner"),
    codeSnippet: z.string().max(8000).nullable().optional(),
    status: z.enum(["draft", "pending"]).default("draft"),
    options: z.array(optionInput).default([]),
    booleanAnswer: z.boolean().optional(),
    hints: z.array(z.string().min(1).max(2000)).max(5).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "true_false") {
      if (typeof data.booleanAnswer !== "boolean") {
        ctx.addIssue({
          code: "custom",
          message: "true_false requires booleanAnswer",
          path: ["booleanAnswer"],
        });
      }
      return;
    }

    if (data.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "At least 2 options required",
        path: ["options"],
      });
      return;
    }

    const correctCount = data.options.filter((o) => o.isCorrect).length;
    if (data.type === "multi_select") {
      if (correctCount < 1) {
        ctx.addIssue({
          code: "custom",
          message: "multi_select needs at least one correct option",
          path: ["options"],
        });
      }
    } else if (correctCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Exactly one correct option required",
        path: ["options"],
      });
    }
  });

export const reviewActionSchema = z.object({
  note: z.string().max(2000).optional(),
});

export const updateQuestionSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  prompt: z.string().min(3).max(5000).optional(),
  explanation: z.string().min(3).max(5000).optional(),
  whyWrong: z.string().max(5000).nullable().optional(),
  workedSolution: z.string().max(8000).nullable().optional(),
  diagramMarkdown: z.string().max(8000).nullable().optional(),
  difficulty: z.enum(difficulties).optional(),
  codeSnippet: z.string().max(8000).nullable().optional(),
  relatedQuestionId: z.string().nullable().optional(),
  similarQuestionId: z.string().nullable().optional(),
  requireReReview: z.boolean().optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type ReviewActionInput = z.infer<typeof reviewActionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

export type PracticeOption = {
  id: string;
  label: string;
  body: string;
  sortOrder?: number;
};

export type CommunityCalibration = {
  attempts: number;
  correct: number;
  percentCorrect: number | null;
};

export type PracticeQuestion = {
  id: string;
  topicId: string;
  type: string;
  title: string;
  prompt: string;
  difficulty: string;
  codeSnippet: string | null;
  diagramMarkdown?: string | null;
  relatedQuestionId: string | null;
  similarQuestionId?: string | null;
  hintCount: number;
  authorId: string;
  authorName: string | null;
  calibration?: CommunityCalibration;
  options: PracticeOption[];
};

export type MyQuestionRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  difficulty: string;
  reviewNote: string | null;
  createdAt: string | Date;
};

export type EditableQuestion = {
  id: string;
  title: string;
  prompt: string;
  explanation: string;
  whyWrong: string | null;
  workedSolution: string | null;
  diagramMarkdown: string | null;
  difficulty: string;
  codeSnippet: string | null;
  status: string;
};
