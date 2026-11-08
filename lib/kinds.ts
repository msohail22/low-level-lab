/**
 * A question kind decides two things: what the reader does, and how the answer
 * is checked.
 *
 * There are two families.
 *
 * OPEN kinds have no machine-checkable answer. The reader works it out, then
 * reveals a written answer. The answer lives in the MDX body inside a
 * <Solution> or <Answer> block.
 *
 * CHOICE kinds have options the browser can grade with no server. The options
 * live in frontmatter, not in the body, so the validator can prove that an
 * mcq has exactly one correct answer before the question is allowed to merge.
 */
export const KINDS = [
  "coding",
  "predict-output",
  "debug",
  "mcq",
  "multi",
  "true-false",
] as const;

export type Kind = (typeof KINDS)[number];

export const CHOICE_KINDS = ["mcq", "multi", "true-false"] as const;

export function isChoiceKind(kind: string): boolean {
  return (CHOICE_KINDS as readonly string[]).includes(kind);
}

export const KIND_LABELS: Record<Kind, string> = {
  coding: "Coding",
  "predict-output": "Predict the output",
  debug: "Find the bug",
  mcq: "Multiple choice",
  multi: "Multi-select",
  "true-false": "True or false",
};

export const KIND_BLURBS: Record<Kind, string> = {
  coding: "Write and compile a program that passes the test cases.",
  "predict-output": "Read the program and say exactly what it prints.",
  debug: "The program is wrong. Find the defect and explain the fix.",
  mcq: "Pick the one correct option.",
  multi: "Pick every correct option. Partial answers do not count.",
  "true-false": "Decide whether the claim holds.",
};

/** Headings every question of a kind must contain, checked by the validator. */
export const REQUIRED_HEADINGS: Record<Kind, string[]> = {
  coding: ["## Problem", "## Constraints", "## Example", "## Test cases", "## Explanation"],
  "predict-output": ["## Program", "## Explanation"],
  debug: ["## Program", "## Explanation"],
  mcq: ["## Question", "## Explanation"],
  multi: ["## Question", "## Explanation"],
  "true-false": ["## Question", "## Explanation"],
};

/** The MDX component a kind must use, checked by the validator. */
export const REQUIRED_BLOCK: Record<Kind, string> = {
  coding: "<Solution",
  "predict-output": "<Answer",
  debug: "<Answer",
  mcq: "<Choices",
  multi: "<Choices",
  "true-false": "<Choices",
};
