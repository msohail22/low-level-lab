import { z } from "zod";

export const questionTypes = [
  "mcq",
  "true_false",
  "multi_select",
  "print_output",
  "spot_bug",
] as const;

export const difficulties = ["beginner", "intermediate", "advanced"] as const;

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
    relatedQuestionId: z.string().nullable().optional(),
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

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
