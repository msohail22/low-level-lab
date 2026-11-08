import Link from "next/link";
import { allQuestions } from "@/lib/questions";

export default function Home() {
  const total = allQuestions().length;

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Low Level Lab
      </h1>
      <p className="mt-3 text-lg text-muted">
        A project to learn programming by practice (a lot of practice).
      </p>

      <p className="mt-8 leading-relaxed">
        Every question here is a file in a public repository. You read it, work it
        out, and compile on your own machine. There is no judge and no contest — just
        the questions and an answer you can reveal when you are ready.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/topics"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          {total} question{total === 1 ? "" : "s"}
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
