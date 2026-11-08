import Link from "next/link";
import { TOPICS } from "@/lib/topics";
import { allQuestions } from "@/lib/questions";

export default function Home() {
  const total = allQuestions().length;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-4xl font-semibold tracking-tight">Low Level Lab</h1>
      <p className="mt-3 text-lg text-muted">
        A project to learn programming by practice (a lot of practice).
      </p>

      <div className="mt-8 space-y-4 leading-relaxed">
        <p>
          Every question here is a file in a public repository. You read the problem,
          copy the test cases, and compile it on your own machine. There is no judge
          and no contest — just the questions, the test cases, and an accepted
          solution you can reveal when you are ready.
        </p>
        <p className="text-muted">
          {total} question{total === 1 ? "" : "s"} across {TOPICS.length} topics.
          Reading everything is free and needs no account.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/topics"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Browse topics
        </Link>
        <Link
          href="/contribute"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
        >
          Add a question
        </Link>
      </div>
    </div>
  );
}
