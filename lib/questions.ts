import type { ComponentType } from "react";
import { frontmatterSchema, type Frontmatter } from "./schema.ts";
import { DIFFICULTY_ORDER, TOPIC_SLUGS, type Difficulty } from "./topics.ts";

/**
 * Two globs, on purpose.
 *
 * `metaModules` is eager but pulls only the `frontmatter` export, so the whole
 * index is in the bundle and a list page renders with zero I/O.
 *
 * `bodyModules` is lazy, so each question's prose and solution becomes its own
 * chunk and is fetched only when that question is opened.
 *
 * Neither touches the filesystem at request time, which matters because this
 * deploys to Cloudflare Workers.
 */
const metaModules = import.meta.glob<Frontmatter>("/content/*/*.mdx", {
  eager: true,
  import: "frontmatter",
});

const bodyModules = import.meta.glob<{ default: ComponentType<unknown> }>(
  "/content/*/*.mdx",
);

export type Question = Frontmatter & {
  topic: string;
  /** Path relative to the repo root, for the "Edit on GitHub" link. */
  file: string;
};

function parsePath(path: string) {
  const match = path.match(/^\/content\/([^/]+)\/([^/]+)\.mdx$/);
  if (!match) throw new Error(`Unexpected content path: ${path}`);
  return { topic: match[1], filename: match[2] };
}

/** Built once at module load. Throws on a bad question, so the build fails. */
const QUESTIONS: Question[] = Object.entries(metaModules)
  .map(([path, raw]) => {
    const { topic, filename } = parsePath(path);

    if (!TOPIC_SLUGS.includes(topic as never)) {
      throw new Error(
        `${path}: "${topic}" is not a known topic. Add it to lib/topics.ts.`,
      );
    }

    const parsed = frontmatterSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `${path}: invalid frontmatter.\n${z_errors(parsed.error.issues)}`,
      );
    }
    if (parsed.data.slug !== filename) {
      throw new Error(
        `${path}: slug "${parsed.data.slug}" must match the filename "${filename}".`,
      );
    }

    return { ...parsed.data, topic, file: path.slice(1) };
  })
  .sort(compareQuestions);

function z_errors(issues: { path: (string | number | symbol)[]; message: string }[]) {
  return issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
}

/** Easy before medium before hard, then `order`, then title. */
function compareQuestions(a: Question, b: Question) {
  const band =
    DIFFICULTY_ORDER[a.difficulty as Difficulty] -
    DIFFICULTY_ORDER[b.difficulty as Difficulty];
  if (band !== 0) return band;
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

export function allQuestions(): Question[] {
  return QUESTIONS;
}

export function questionsByTopic(topic: string): Question[] {
  return QUESTIONS.filter((q) => q.topic === topic);
}

export function countsByDifficulty(topic: string) {
  const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const q of questionsByTopic(topic)) {
    counts[q.difficulty as Difficulty] += 1;
  }
  return counts;
}

export function findQuestion(topic: string, slug: string): Question | undefined {
  return QUESTIONS.find((q) => q.topic === topic && q.slug === slug);
}

/** Dynamically imports one question's MDX component. */
export async function loadQuestionBody(topic: string, slug: string) {
  const loader = bodyModules[`/content/${topic}/${slug}.mdx`];
  if (!loader) return undefined;
  const mod = await loader();
  return mod.default;
}
