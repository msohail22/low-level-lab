import { z } from "zod";
import { DIFFICULTIES, TOPIC_SLUGS } from "./topics.ts";
import { isChoiceKind, KINDS } from "./kinds.ts";

const choiceSchema = z.object({
  /** Shown to the reader. Inline markdown such as `code` is rendered. */
  text: z.string().min(1),
  correct: z.boolean().default(false),
});

export type Choice = z.infer<typeof choiceSchema>;

export const frontmatterSchema = z
  .object({
    title: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lowercase-kebab-case"),
    /** Defaults to coding so the first questions needed no migration. */
    kind: z.enum(KINDS).default("coding"),
    difficulty: z.enum(DIFFICULTIES),
    /** Tie-break inside a difficulty band. Lower comes first. */
    order: z.number().int().nonnegative(),
    tags: z.array(z.string().min(1)).default([]),
    authors: z.array(z.string().min(1)).min(1),
    /** Required for choice kinds, forbidden otherwise. */
    choices: z.array(choiceSchema).optional(),
    /**
     * The exact text a predict-output question must print. Graded against what
     * the reader types, after trimming trailing whitespace on each line.
     */
    expected: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const choiceKind = isChoiceKind(data.kind);

    // Only predict-output has a machine-checkable free-text answer. A debug
    // question's answer is prose, so it cannot be graded.
    if (data.kind === "predict-output" && data.expected === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["expected"],
        message: "predict-output needs an `expected` block holding the exact output.",
      });
    }
    if (data.kind !== "predict-output" && data.expected !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["expected"],
        message: `kind "${data.kind}" must not define expected; only predict-output is graded on typed text.`,
      });
    }

    if (!choiceKind) {
      if (data.choices !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["choices"],
          message: `kind "${data.kind}" is an open question, so it must not define choices.`,
        });
      }
      return;
    }

    const choices = data.choices;
    if (choices === undefined || choices.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: `kind "${data.kind}" needs at least 2 choices.`,
      });
      return;
    }

    const correct = choices.filter((c) => c.correct).length;

    if (data.kind === "mcq" && correct !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: `mcq needs exactly 1 correct choice, found ${correct}.`,
      });
    }

    if (data.kind === "multi" && correct < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: `multi needs at least 2 correct choices, found ${correct}. Use kind "mcq" for a single answer.`,
      });
    }

    if (data.kind === "true-false") {
      if (choices.length !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["choices"],
          message: `true-false needs exactly 2 choices, found ${choices.length}.`,
        });
      }
      if (correct !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["choices"],
          message: `true-false needs exactly 1 correct choice, found ${correct}.`,
        });
      }
    }

    const seen = new Set<string>();
    for (const [i, c] of choices.entries()) {
      if (seen.has(c.text)) {
        ctx.addIssue({
          code: "custom",
          path: ["choices", i, "text"],
          message: `duplicate choice text: "${c.text}".`,
        });
      }
      seen.add(c.text);
    }
  });

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const topicSchema = z.enum(TOPIC_SLUGS as [string, ...string[]]);
