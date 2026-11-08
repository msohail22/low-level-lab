import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic, TOPIC_SLUGS } from "@/lib/topics";
import { countsByDifficulty, questionsByTopic } from "@/lib/questions";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { KindBadge } from "@/components/KindBadge";

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

  const questions = questionsByTopic(topicSlug);
  const counts = countsByDifficulty(topicSlug);

  return (
    <div>
      <nav className="text-xs text-muted">
        <Link href="/topics" className="hover:text-accent">
          Topics
        </Link>
      </nav>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{topic.name}</h1>
        <span className="flex gap-3 text-xs font-medium">
          <span className="text-easy">{counts.easy} easy</span>
          <span className="text-medium">{counts.medium} medium</span>
          <span className="text-hard">{counts.hard} hard</span>
        </span>
      </div>

      <ul className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        {questions.map((q, i) => (
          <li key={q.slug} className="border-b border-border last:border-0">
            <Link
              href={`/topics/${topicSlug}/${q.slug}`}
              className="flex items-baseline gap-3 px-4 py-3 hover:bg-bg"
            >
              <span className="w-5 shrink-0 text-sm text-muted">{i + 1}</span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{q.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted sm:hidden">
                  <DifficultyBadge difficulty={q.difficulty} />
                  <KindBadge kind={q.kind} />
                </span>
              </span>

              <span className="hidden shrink-0 items-center gap-3 sm:flex">
                <KindBadge kind={q.kind} />
                <span className="w-16 text-right">
                  <DifficultyBadge difficulty={q.difficulty} />
                </span>
              </span>
            </Link>
          </li>
        ))}

        {questions.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted">
            No questions yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
