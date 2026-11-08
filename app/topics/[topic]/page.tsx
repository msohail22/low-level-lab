import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic, TOPIC_SLUGS } from "@/lib/topics";
import { countsByDifficulty, questionsByTopic } from "@/lib/questions";
import { DifficultyBadge } from "@/components/DifficultyBadge";

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
        <span className="mx-1.5">/</span>
        <span>{topic.name}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{topic.name}</h1>
        <span className="text-sm text-muted">
          {questions.length} question{questions.length === 1 ? "" : "s"}
          {" · "}
          <span className="text-easy">{counts.easy} easy</span>
          {" · "}
          <span className="text-medium">{counts.medium} medium</span>
          {" · "}
          <span className="text-hard">{counts.hard} hard</span>
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="w-12 px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Tags</th>
              <th className="w-24 px-4 py-2.5 font-medium">Difficulty</th>
              <th className="w-20 px-4 py-2.5 text-center font-medium">Solved</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr
                key={q.slug}
                className="border-b border-border last:border-0 hover:bg-bg"
              >
                <td className="px-4 py-3 text-muted">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/topics/${topicSlug}/${q.slug}`}
                    className="font-medium hover:text-accent"
                  >
                    {q.title}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted sm:table-cell">
                  {q.tags.join(", ")}
                </td>
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={q.difficulty} />
                </td>
                <td className="px-4 py-3 text-center text-muted">—</td>
              </tr>
            ))}
          </tbody>
        </table>

        {questions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No questions yet for this topic.
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-muted">
        Progress tracking is not built yet. Sign-in will come later; for now the
        solved column stays empty.
      </p>
    </div>
  );
}
