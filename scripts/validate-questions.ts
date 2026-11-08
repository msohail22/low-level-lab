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
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { frontmatterSchema } from "../lib/schema.ts";
import { TOPIC_SLUGS } from "../lib/topics.ts";
import { needsTestFile, REQUIRED_HEADINGS, requiredBlocks, type Kind } from "../lib/kinds.ts";

const CONTENT_DIR = join(import.meta.dirname, "..", "content");

const problems: string[] = [];
let checked = 0;

/**
 * Titles already seen, keyed by topic, for the duplicate check below.
 *
 * Two questions cannot share a slug inside one topic — the slug is the
 * filename, so git stops that as an add/add conflict before CI ever runs. What
 * git cannot see is the same question added twice under different slugs, which
 * merges cleanly and leaves a duplicate. A matching title is the cheap signal
 * for that.
 */
const titles = new Map<string, Map<string, string>>();

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

    // Heading and block rules depend on the kind, so a coding question is not
    // held to an mcq's contract and the other way round.
    const kind = parsed.data.kind as Kind;

    const missing = REQUIRED_HEADINGS[kind].filter((h) => !text.includes(h));
    if (missing.length > 0) {
      fail(rel, `kind "${kind}" requires heading(s): ${missing.join(", ")}`);
    }

    for (const block of requiredBlocks(kind)) {
      if (!text.includes(block)) {
        fail(rel, `kind "${kind}" requires a ${block}> block in the body.`);
      }
    }

    // Normalised so "Two Sum" and "two  sum" collide.
    const titleKey = parsed.data.title.toLowerCase().replace(/\s+/g, " ").trim();
    let topicTitles = titles.get(topic);
    if (topicTitles === undefined) {
      topicTitles = new Map();
      titles.set(topic, topicTitles);
    }
    const clash = topicTitles.get(titleKey);
    if (clash !== undefined) {
      fail(
        rel,
        `title "${parsed.data.title}" is already used by ${clash}. Two questions in one topic must not share a title.`,
      );
    } else {
      topicTitles.set(titleKey, rel);
    }

    // A coding question is solved by running it, so the cases must exist. Any
    // other kind must not carry a tests file, or it would never be served.
    const testFile = join(CONTENT_DIR, topic, `${expected}.tests.jsonl`);
    const hasTests = existsSync(testFile);

    if (needsTestFile(kind) && !hasTests) {
      fail(rel, `kind "${kind}" requires content/${topic}/${expected}.tests.jsonl`);
    }
    if (!needsTestFile(kind) && hasTests) {
      fail(
        rel,
        `kind "${kind}" must not carry a tests file, but content/${topic}/${expected}.tests.jsonl exists.`,
      );
    }

    // The "Show answer" button has to sit at the bottom of the page, so the
    // <Answer> block must be the last thing in the file. A heading after it
    // would render below the button.
    const answerAt = text.indexOf("<Answer");
    if (answerAt !== -1) {
      const after = text.slice(answerAt + "<Answer".length);
      const strayHeading = after.match(/^## .+$/m);
      if (strayHeading) {
        fail(
          rel,
          `"${strayHeading[0]}" comes after the <Answer> block. <Answer> must be last so the Show answer button stays at the bottom.`,
        );
      }
      if (after.includes("<Choices")) {
        fail(rel, "<Choices /> comes after the <Answer> block. Put the options before it.");
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} invalid question${problems.length === 1 ? "" : "s"}:\n`);
  for (const p of problems) console.error(`${p}\n`);
  process.exit(1);
}

console.log(`✓ ${checked} question${checked === 1 ? "" : "s"} valid.`);
