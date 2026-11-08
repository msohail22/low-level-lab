import { TOPICS } from "@/lib/topics";

const TEMPLATE = `---
title: Your question title
slug: your-question-title
difficulty: easy
order: 10
tags: [pointers, memory]
authors: [your-github-login]
---

## Problem

...

## Constraints

- ...

## Example

\`\`\`text
input
\`\`\`

\`\`\`text
output
\`\`\`

## Test cases

\`\`\`text
input
\`\`\`

\`\`\`text
output
\`\`\`

<Solution language="cpp">

\`\`\`cpp
// the accepted solution
\`\`\`

</Solution>

## Explanation

...
`;

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Contribute a question</h1>
      <p className="mt-2 text-muted">
        Anyone can add a question. There are no roles and no approval queue beyond a
        normal pull request review.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Where the file goes</h2>
      <p className="mt-2 text-sm">
        One MDX file per question. The directory is the topic, and the filename must
        match the <code className="rounded bg-border/50 px-1">slug</code> in the
        frontmatter.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface p-4 text-xs">
        {TOPICS.map((t) => `content/${t.slug}/<slug>.mdx   # ${t.name}`).join("\n")}
      </pre>

      <h2 className="mt-10 text-lg font-semibold">Frontmatter</h2>
      <ul className="mt-2 space-y-1.5 text-sm">
        <li>
          <code className="rounded bg-border/50 px-1">title</code> — shown in the list
        </li>
        <li>
          <code className="rounded bg-border/50 px-1">slug</code> — lowercase kebab
          case, must equal the filename
        </li>
        <li>
          <code className="rounded bg-border/50 px-1">difficulty</code> —{" "}
          <code className="rounded bg-border/50 px-1">easy</code>,{" "}
          <code className="rounded bg-border/50 px-1">medium</code> or{" "}
          <code className="rounded bg-border/50 px-1">hard</code>
        </li>
        <li>
          <code className="rounded bg-border/50 px-1">order</code> — a number that
          tie-breaks inside a difficulty band, lower first
        </li>
        <li>
          <code className="rounded bg-border/50 px-1">tags</code> — a list of strings
        </li>
        <li>
          <code className="rounded bg-border/50 px-1">authors</code> — GitHub logins,
          at least one
        </li>
      </ul>
      <p className="mt-3 text-sm text-muted">
        The frontmatter is validated at build time. If it is wrong, the build fails
        and the pull request cannot merge.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Template</h2>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface p-4 text-xs leading-relaxed">
        {TEMPLATE}
      </pre>

      <h2 className="mt-10 text-lg font-semibold">The headings are fixed</h2>
      <p className="mt-2 text-sm">
        Use <code className="rounded bg-border/50 px-1">Problem</code>,{" "}
        <code className="rounded bg-border/50 px-1">Constraints</code>,{" "}
        <code className="rounded bg-border/50 px-1">Example</code>,{" "}
        <code className="rounded bg-border/50 px-1">Test cases</code>, the{" "}
        <code className="rounded bg-border/50 px-1">&lt;Solution&gt;</code> block, then{" "}
        <code className="rounded bg-border/50 px-1">Explanation</code>, in that order.
        Every question reads the same way, so a reader never hunts for the test cases.
      </p>
    </div>
  );
}
