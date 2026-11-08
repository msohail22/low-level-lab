/**
 * A question kind decides two things: what the reader does, and how the answer
 * is checked.
 *
 * OPEN kinds have no machine-checkable answer. The reader works it out, then
 * presses "Show answer" at the bottom of the page.
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

/**
 * Headings every question of a kind must contain.
 *
 * Deliberately short. A question is a clear description and nothing else. Only
 * a coding question needs more, because the reader has to know what arrives on
 * stdin and what is expected on stdout.
 */
export const REQUIRED_HEADINGS: Record<Kind, string[]> = {
  coding: ["## Description", "## Input", "## Output"],
  "predict-output": ["## Description"],
  debug: ["## Description"],
  mcq: ["## Description"],
  multi: ["## Description"],
  "true-false": ["## Description"],
};

/**
 * Every kind ends with an <Answer> block, and choice kinds also carry a
 * <Choices /> marker. The <Answer> block must be last in the file, so the
 * "Show answer" button always sits at the bottom of the page.
 */
export function requiredBlocks(kind: Kind): string[] {
  return isChoiceKind(kind) ? ["<Choices", "<Answer"] : ["<Answer"];
}
