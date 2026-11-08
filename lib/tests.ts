import { z } from "zod";

/**
 * One test case. `in` is what the program reads on stdin, `out` is what it must
 * print on stdout. `note` is an optional one-line label for a case that exists
 * to catch a specific mistake.
 */
export const testCaseSchema = z.object({
  in: z.string(),
  out: z.string(),
  note: z.string().optional(),
});

export type TestCase = z.infer<typeof testCaseSchema>;

/** Cases per generated chunk file. */
export const CHUNK_SIZE = 25;

/** What `public/tests/<topic>/<slug>/index.json` holds. */
export const testIndexSchema = z.object({
  count: z.number().int().nonnegative(),
  chunkSize: z.number().int().positive(),
  chunks: z.number().int().nonnegative(),
});

export type TestIndex = z.infer<typeof testIndexSchema>;

/** Source file for a question's cases, relative to the repo root. */
export function testSourcePath(topic: string, slug: string) {
  return `content/${topic}/${slug}.tests.jsonl`;
}

/** Public URL the browser fetches. */
export function testIndexUrl(topic: string, slug: string) {
  return `/tests/${topic}/${slug}/index.json`;
}

export function testChunkUrl(topic: string, slug: string, chunk: number) {
  return `/tests/${topic}/${slug}/chunk-${chunk}.json`;
}

export function testDownloadUrl(topic: string, slug: string) {
  return `/tests/${topic}/${slug}/all.jsonl`;
}
