/**
 * A question kind decides two things: what the reader does, and how the answer
 * is checked.
 *
 * Only two shapes exist. A coding question is compiled locally against test
 * cases. Every other kind is graded in the browser from options that live in
 * frontmatter. There is no free-text kind: an answer nobody can check is not
 * worth asking the reader to type.
 */
export const KINDS = ["coding", "mcq", "multi", "true-false"] as const;

export type Kind = (typeof KINDS)[number];

export const CHOICE_KINDS = ["mcq", "multi", "true-false"] as const;

export function isChoiceKind(kind: string): boolean {
  return (CHOICE_KINDS as readonly string[]).includes(kind);
}

export const KIND_LABELS: Record<Kind, string> = {
  coding: "Coding",
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
  coding: ["## Description", "## Input", "## Output", "## Test cases"],
  mcq: ["## Description"],
  multi: ["## Description"],
  "true-false": ["## Description"],
};

/**
 * Every kind ends with an <Answer> block, which must be last in the file so the
 * "Show answer" button stays at the bottom of the page.
 */
export function requiredBlocks(kind: Kind): string[] {
  if (isChoiceKind(kind)) return ["<Choices", "<Answer"];
  // A coding question is solved by running it, so it must ship cases to run.
  return ["<TestCases", "<Answer"];
}

/** Only a coding question carries a .tests.jsonl file. */
export function needsTestFile(kind: Kind): boolean {
  return kind === "coding";
}
