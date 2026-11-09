import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic, TOPIC_SLUGS, type Difficulty } from "@/lib/topics";
import { questionsByTopic } from "@/lib/questions";
import { QuestionList, type Row } from "@/components/QuestionList";
import type { Kind } from "@/lib/kinds";

export function generateStaticParams() {
  return TOPIC_SLUGS.map((topic) => ({ topic }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: topicSlug } = await params;
  const topic = getTopic(topicSlug);
  if (!topic) notFound();

  // Only what a row needs. Sending the whole question would ship every
  // answer in the topic to the list page.
  const rows: Row[] = questionsByTopic(topicSlug).map((q) => ({
    slug: q.slug,
    title: q.title,
    kind: q.kind as Kind,
    difficulty: q.difficulty as Difficulty,
  }));

  return (
    <div>
      <nav className="text-xs text-muted">
        <Link href="/topics" className="hover:text-accent">
          Topics
        </Link>
      </nav>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{topic.name}</h1>

      <QuestionList topicSlug={topicSlug} rows={rows} />
    </div>
  );
}
