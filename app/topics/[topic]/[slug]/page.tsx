import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic } from "@/lib/topics";
import { allQuestions, findQuestion, loadQuestionBody } from "@/lib/questions";
import { QuestionBody } from "@/components/QuestionBody";
import { DifficultyBadge } from "@/components/DifficultyBadge";

const REPO = "https://github.com/msohail22/low-level-lab";

export function generateStaticParams() {
  return allQuestions().map((q) => ({ topic: q.topic, slug: q.slug }));
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ topic: string; slug: string }>;
}) {
  const { topic: topicSlug, slug } = await params;

  const topic = getTopic(topicSlug);
  const question = findQuestion(topicSlug, slug);
  if (!topic || !question) notFound();

  const Body = await loadQuestionBody(topicSlug, slug);
  if (!Body) notFound();

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="text-xs text-muted">
        <Link href="/topics" className="hover:text-accent">
          Topics
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/topics/${topicSlug}`} className="hover:text-accent">
          {topic.name}
        </Link>
      </nav>

      <header className="mt-3 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">{question.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <DifficultyBadge difficulty={question.difficulty} />
          {question.tags.length > 0 ? <span>{question.tags.join(" · ")}</span> : null}
          <span>by {question.authors.join(", ")}</span>
          <a
            href={`${REPO}/blob/master/${question.file}`}
            className="hover:text-accent"
            target="_blank"
            rel="noreferrer"
          >
            Edit on GitHub ↗
          </a>
        </div>
      </header>

      <div className="mt-8">
        <QuestionBody Body={Body} />
      </div>

      <footer className="mt-12 border-t border-border pt-5 text-sm text-muted">
        <Link href={`/topics/${topicSlug}`} className="hover:text-accent">
          ← Back to {topic.name}
        </Link>
      </footer>
    </article>
  );
}
