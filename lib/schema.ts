import { z } from "zod";
import { DIFFICULTIES, TOPIC_SLUGS } from "./topics.ts";

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be lowercase-kebab-case"),
  difficulty: z.enum(DIFFICULTIES),
  /** Tie-break inside a difficulty band. Lower comes first. */
  order: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)).default([]),
  authors: z.array(z.string().min(1)).min(1),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const topicSchema = z.enum(TOPIC_SLUGS as [string, ...string[]]);
