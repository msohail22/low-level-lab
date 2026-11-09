/**
 * Splits every `content/<topic>/<slug>.tests.jsonl` into small chunk files
 * under `public/tests/<topic>/<slug>/`, which the Worker serves as static
 * assets.
 *
 * Why chunk at all: a question may carry thousands of cases. Putting them in
 * the page would bloat the HTML, and putting them in the MDX would bundle them
 * into the question's JavaScript chunk. Both make every page load pay for data
 * almost nobody scrolls through. As static chunks, the browser fetches 25 cases
 * at a time, only after the reader asks for them.
 *
 * Runs under plain node before `vite build`, so it may use node:fs. The output
 * is static files; nothing reads the filesystem at request time.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CHUNK_SIZE, testCaseSchema, type TestCase } from "../lib/tests.ts";

const ROOT = join(import.meta.dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const OUT_DIR = join(ROOT, "public", "tests");

const problems: string[] = [];
let questions = 0;
let cases = 0;

// Rebuilt from scratch every run, so a renamed or deleted question cannot leave
// stale chunks behind to be served forever.
rmSync(OUT_DIR, { recursive: true, force: true });

const topics = readdirSync(CONTENT_DIR).filter((n) =>
  statSync(join(CONTENT_DIR, n)).isDirectory(),
);

for (const topic of topics) {
  const files = readdirSync(join(CONTENT_DIR, topic)).filter((f) =>
    f.endsWith(".tests.jsonl"),
  );

  for (const filename of files) {
    const slug = filename.replace(/\.tests\.jsonl$/, "");
    const rel = `content/${topic}/${filename}`;
    const text = readFileSync(join(CONTENT_DIR, topic, filename), "utf8");

    const parsed: TestCase[] = [];
    const lines = text.split("\n");

    for (const [i, line] of lines.entries()) {
      if (line.trim() === "") continue;

      let raw: unknown;
      try {
        raw = JSON.parse(line);
      } catch {
        problems.push(`${rel}:${i + 1}\n  not valid JSON. One JSON object per line.`);
        continue;
      }

      const result = testCaseSchema.safeParse(raw);
      if (!result.success) {
        problems.push(
          `${rel}:${i + 1}\n  ${result.error.issues
            .map((is) => `${is.path.join(".") || "(root)"}: ${is.message}`)
            .join("\n  ")}`,
        );
        continue;
      }
      parsed.push(result.data);
    }

    if (parsed.length === 0) {
      problems.push(`${rel}\n  no test cases found.`);
      continue;
    }

    // A repeated case is dead weight in a file that may hold thousands, and
    // every reader who loads that chunk pays for it.
    const seen = new Map<string, number>();
    for (const [i, c] of parsed.entries()) {
      const key = `${c.in}\u0000${c.out}`;
      const first = seen.get(key);
      if (first !== undefined) {
        problems.push(
          `${rel}\n  case ${i + 1} duplicates case ${first + 1}. Remove the redundant case.`,
        );
      } else {
        seen.set(key, i);
      }
    }

    const dir = join(OUT_DIR, topic, slug);
    mkdirSync(dir, { recursive: true });

    const chunks = Math.ceil(parsed.length / CHUNK_SIZE);
    for (let c = 0; c < chunks; c += 1) {
      writeFileSync(
        join(dir, `chunk-${c}.json`),
        JSON.stringify(parsed.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE)),
      );
    }

    // The whole set as one file, for a reader who wants to run every case
    // locally. Served from the asset store, so it costs nothing until clicked.
    writeFileSync(
      join(dir, "all.jsonl"),
      parsed.map((c) => JSON.stringify(c)).join("\n") + "\n",
    );

    writeFileSync(
      join(dir, "index.json"),
      JSON.stringify({ count: parsed.length, chunkSize: CHUNK_SIZE, chunks }),
    );

    questions += 1;
    cases += parsed.length;
  }
}

if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} problem(s) in test case files:\n`);
  for (const p of problems) console.error(`${p}\n`);
  process.exit(1);
}

console.log(`✓ ${cases} test cases across ${questions} question(s) chunked.`);
