
export default function ContributePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Contribute a question</h1>

      <p className="mt-4 text-muted">
        Questions are MDX files in the repository, so adding one is a pull request.
        Anyone can open one — there are no roles and no approval queue beyond a normal
        review.
      </p>

      <p className="mt-4 text-muted">
        The format is still settling, so this page is a stub. The frontmatter contract
        and a template per question kind will land here once the shape stops moving.
        Until then, copy an existing file under{" "}
        <code className="rounded bg-border/50 px-1">content/cpp/</code> and follow it.
      </p>

      <p className="mt-4 text-muted">
        A coding question also needs a{" "}
        <code className="rounded bg-border/50 px-1">&lt;slug&gt;.tests.jsonl</code>{" "}
        beside it — one JSON object per line, each with an{" "}
        <code className="rounded bg-border/50 px-1">in</code> and an{" "}
        <code className="rounded bg-border/50 px-1">out</code> string. The build
        splits it into chunks the page loads on demand, so a file with thousands of
        cases costs the reader nothing until they ask for them.
      </p>

    </div>
  );
}
