const REPO = "https://github.com/msohail22/low-level-lab";

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Contribute a question</h1>

      <p className="mt-4 text-muted">
        Questions are MDX files in the repository, so adding one is a pull request.
        Anyone can open one — there are no roles and no approval queue beyond a normal
        review.
      </p>

      {/*
        The format contract is not repeated here. It lives in CONTRIBUTING.md next to
        the validator that enforces it, and two copies of one contract drift. This
        page's job is to get a reader to that file.
      */}
      <p className="mt-4 text-muted">
        The full steps, the four question kinds and the test-case format are in{" "}
        <a
          className="underline"
          href={`${REPO}/blob/master/CONTRIBUTING.md`}
          target="_blank"
          rel="noreferrer"
        >
          CONTRIBUTING.md
        </a>
        . It is one file to copy and one command to check it.
      </p>

      <p className="mt-4 text-muted">
        <code className="rounded bg-border/50 px-1">pnpm validate</code> is the review.
        It checks the frontmatter, the required headings, the choice counts and the test
        file, and CI runs it on every pull request — so a question that breaks the
        format cannot merge and nobody has to read the diff to catch it.
      </p>

      <p className="mt-6">
        <a
          className="underline"
          href={`${REPO}/issues/new/choose`}
          target="_blank"
          rel="noreferrer"
        >
          Suggest a question without writing it
        </a>
      </p>
    </div>
  );
}
