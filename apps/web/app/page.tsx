import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";

export default async function Home() {
  syncWorkosEnv();

  let user = null;
  try {
    ({ user } = await withAuth());
  } catch {
    user = null;
  }

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
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg"
        >
          Browse topics
        </Link>

        {user ? (
          <Link
            href="/me"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Your progress
          </Link>
        ) : null}
      </div>

      {!user ? (
        <p className="mt-4 text-sm text-muted">
          Reading everything is free and needs no account. Sign in only to save
          which questions you have solved.
        </p>
      ) : null}
    </div>
  );
}
