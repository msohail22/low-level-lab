# 🤝 Contributing

**The most useful thing you can add is one question.** It is a single file.

No roles, no approval queue, no style meeting. Open a pull request and CI tells
you whether the format is right.

## 🏁 Setup

```sh
pnpm install
pnpm dev          # → http://[::1]:5173
```

## 📝 Add a question in three steps

**1. Copy an existing one.** Do not start from a blank file.

```sh
cp apps/web/content/cpp/delete-null-pointer.mdx \
   apps/web/content/cpp/my-question.mdx
```

**2. Edit it.** The filename must equal the `slug` in the frontmatter.

```yaml
---
title: What does deleting a null pointer do?
slug: my-question          # ← must match the filename
kind: mcq                  # coding | mcq | multi | true-false
difficulty: easy           # easy | medium | hard
order: 10                  # tie-break inside a band, lower first
tags: [memory, pointers]
authors: [your-github-login]
---
```

**3. Check it.**

```sh
pnpm validate
```

That is the review. If it passes, open the pull request.

## 🧩 The four kinds

| Kind | Shape | Needs |
|---|---|---|
| `coding` | solve it on your machine | `## Description`, `## Input`, `## Output`, `## Test cases` with `<TestCases />`, plus a `.tests.jsonl` file |
| `mcq` | exactly 1 correct option | `## Description`, `choices` in frontmatter, bare `<Choices />` |
| `multi` | 2 or more correct | same as `mcq` |
| `true-false` | exactly 2 options, 1 correct | same as `mcq` |

Every kind ends with `<Answer>`, and it **must be the last thing in the file**.
Put your explanation inside it.

```mdx
## Description

What does `delete` on a null pointer do?

<Choices />

<Answer>
Nothing. `delete nullptr` is explicitly well-defined and required to be a no-op.
</Answer>
```

Choices live in **frontmatter**, not the body, so the validator can prove an
`mcq` has exactly one correct answer before it merges:

```yaml
choices:
  - text: "Nothing, it is a no-op"
    correct: true
  - text: "Undefined behaviour"
```

> [!WARNING]
> YAML reads a bare `null`, `yes`, `no`, `on`, `off` as a non-string. Quote
> those tags: `tags: [memory, "null"]`.

## 🧪 Test cases, for `coding` only

One JSON object per line in `apps/web/content/<topic>/<slug>.tests.jsonl`:

```json
{"in": "2\n7 9", "out": "9 7", "note": "optional one-line label"}
```

Put the hand-written edge cases **first**, with a `note`, then the bulk ones.
A reader skims the top of the file, so the interesting cases belong there.

Duplicate cases are rejected by name and line. A file may hold thousands and
every reader loading that chunk pays for it.

> [!NOTE]
> Never put test cases in the MDX body or in frontmatter. They are static
> assets, fetched 25 at a time, only after the reader asks for them.

## 💡 What makes a good question

- ✅ **One idea.** If it needs two paragraphs of setup, it is two questions.
- ✅ **Checkable.** "What does this print" becomes an `mcq` whose options are
  candidate outputs. "Find the bug" becomes an `mcq` whose options are
  candidate defects. Both grade honestly that way.
- ❌ **Not a duplicate.** Two questions in one topic may not share a title.
  A reworded duplicate is the one thing CI cannot catch, so search first.
- ❌ **No kind in the title.** The badge already says it.

## ✅ Before you open the PR

**Run these. They are the review.**

```sh
pnpm validate
pnpm build:tests
pnpm typecheck
pnpm build
```

> [!WARNING]
> **Automated checks are switched off right now** — the workflow has a startup
> fault and is being fixed. Nothing on the server will catch a mistake for
> you, so a pull request that has not been checked locally will be sent back.
> Say in the PR that you ran them.

When CI is back it runs all four. It also fails if generated files
(`apps/web/public/tests/`) are committed — those are built, never checked in.

One more thing CI enforces: **your branch must be up to date with `master`.**
If someone merged while your PR was open, rebase. That is how a duplicate
introduced by the other PR gets caught.

## ⚠️ One thing not to build on

`apps/engine` is a proof of concept and is expected to be dropped. Do not write
a question that depends on remote execution, and do not send a pull request
that makes the site call it. Every question must be solvable with a compiler
and nothing else.

## 🐛 Found a bug instead?

[Open an issue.](https://github.com/msohail22/low-level-lab/issues/new/choose)

## 📄 License

[MIT](LICENSE). By opening a pull request you agree your contribution is
released under it. You keep the copyright on what you wrote; MIT is the
permission everyone else gets to use it.

There is no CLA and nothing to sign.
