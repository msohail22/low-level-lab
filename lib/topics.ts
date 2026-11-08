export const TOPICS = [
  {
    slug: "cpp",
    name: "C++",
    tagline: "Pointers, memory, and the machine underneath.",
  },
] as const;

export type TopicSlug = (typeof TOPICS)[number]["slug"];

export const TOPIC_SLUGS = TOPICS.map((t) => t.slug);

export function getTopic(slug: string) {
  return TOPICS.find((t) => t.slug === slug);
}

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Sort weight. Lower comes first, so easy questions head the list. */
export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};
