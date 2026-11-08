import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopic } from "@/lib/topics";
import { allQuestions, findQuestion, loadQuestionBody } from "@/lib/questions";
import { QuestionBody } from "@/components/QuestionBody";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { KindBadge } from "@/components/KindBadge";

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
        <Link href={`/topics/${topicSlug}`} className="hover:text-accent">
          {topic.name}
        </Link>
      </nav>

      <header className="mt-3 border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {question.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <DifficultyBadge difficulty={question.difficulty} />
          <KindBadge kind={question.kind} />
          <a
            href={`${REPO}/blob/master/${question.file}`}
            className="text-xs text-muted hover:text-accent"
            target="_blank"
            rel="noreferrer"
          >
            Edit on GitHub ↗
          </a>
        </div>
      </header>

      <div className="mt-6">
        <QuestionBody Body={Body} question={question} />
      </div>
    </article>
  );
}
