/**
 * Validates every question in content/ and exits non-zero on the first problem.
 *
 * This exists as a separate script, and not inside lib/questions.ts, because
 * vinext bundles module-level code without executing it. A schema check that
 * only runs on module load would therefore throw at request time in production
 * instead of failing the build. This script runs under plain node, so `pnpm
 * build` and CI can both gate on it.
 *
 * It reads files with node:fs, which is fine: it never ships to Workers.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { frontmatterSchema } from "../lib/schema.ts";
import { TOPIC_SLUGS } from "../lib/topics.ts";

const CONTENT_DIR = join(import.meta.dirname, "..", "content");
const REQUIRED_HEADINGS = ["## Problem", "## Constraints", "## Example", "## Test cases", "## Explanation"];

const problems: string[] = [];
let checked = 0;

function fail(file: string, message: string) {
  problems.push(`${file}\n  ${message}`);
}

function readFrontmatter(text: string): unknown | undefined {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return undefined;
  return parseYaml(match[1]);
}

const topicDirs = readdirSync(CONTENT_DIR).filter((name) =>
  statSync(join(CONTENT_DIR, name)).isDirectory(),
);

for (const topic of topicDirs) {
  if (!TOPIC_SLUGS.includes(topic as never)) {
    problems.push(`content/${topic}\n  not a known topic. Add it to lib/topics.ts or remove the directory.`);
    continue;
  }

  const files = readdirSync(join(CONTENT_DIR, topic)).filter((f) => f.endsWith(".mdx"));

  for (const filename of files) {
    const rel = `content/${topic}/${filename}`;
    const text = readFileSync(join(CONTENT_DIR, topic, filename), "utf8");
    checked += 1;

    const raw = readFrontmatter(text);
    if (raw === undefined) {
      fail(rel, "no YAML frontmatter block found at the top of the file.");
      continue;
    }

    const parsed = frontmatterSchema.safeParse(raw);
    if (!parsed.success) {
      fail(
        rel,
        parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("\n  "),
      );
      continue;
    }

    const expected = filename.replace(/\.mdx$/, "");
    if (parsed.data.slug !== expected) {
      fail(rel, `slug "${parsed.data.slug}" must match the filename "${expected}".`);
    }

    const missing = REQUIRED_HEADINGS.filter((h) => !text.includes(h));
    if (missing.length > 0) {
      fail(rel, `missing required heading(s): ${missing.join(", ")}`);
    }

    if (!text.includes("<Solution")) {
      fail(rel, "no <Solution> block. Every question must ship an accepted solution.");
    }
  }
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} invalid question${problems.length === 1 ? "" : "s"}:\n`);
  for (const p of problems) console.error(`${p}\n`);
  process.exit(1);
}

console.log(`✓ ${checked} question${checked === 1 ? "" : "s"} valid.`);
