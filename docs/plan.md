# Low Level Lab — build plan

> A project to learn programming by practice (a lot of practice).

Status: plan agreed 2026-11-08. Nothing built yet beyond the vinext scaffold.

## 1. Decisions

| ID | Decision | Reason |
|---|---|---|
| D1 | Questions are MDX files in this repo. Git is the database. | Contribution = pull request. GitHub's own permissions decide who merges, so there is no RBAC code to write. |
| D2 | The accepted solution lives inside the same question MDX file. | User's call. One file per question, nothing to keep in sync. Revealed behind a click. |
| D3 | Difficulty is hard-coded in frontmatter: `easy` / `medium` / `hard`. | No judge exists, so a solve count would be self-reported and gameable. Sort easy → medium → hard. No nightly job, no aggregation, for now. |
| D4 | GitHub OAuth is the only sign-in. D1 holds per-user rows. KV is bound but unused at first. | Contributors already have GitHub accounts. No passwords, no email flow. KV binding is created now so the ranking job can be added later without a migration. |
| D5 | Only two topics: C++ and Rust. | Keeps the codebase small, as asked. Topics are a typed list in code, not a database table. |
| D6 | Everything except progress is public. Sign-in is required only to save progress. | A visitor can read every question and every solution without an account. |
| D7 | Content is enumerated with Vite's `import.meta.glob`, never `fs`. | vinext deploys to Cloudflare Workers. The docs do not say `node:fs` works at request time, so the design must not need it. `import.meta.glob` resolves at build time and bundles the result. |

## 2. Content model

One file per question. No folders, no sidecar test files — test cases go in the MDX
as fenced code blocks, because the user compiles locally and only needs to read them.

```
content/
  cpp/
    reverse-a-linked-list.mdx
    two-sum.mdx
  rust/
    borrow-checker-warmup.mdx
```

The directory name IS the topic. A new topic is a new directory plus one line in
`lib/topics.ts`.

### Frontmatter contract

```yaml
---
title: Reverse a linked list
slug: reverse-a-linked-list      # must equal the filename
difficulty: easy                 # easy | medium | hard
order: 10                        # tie-break inside a difficulty band, low first
tags: [linked-list, pointers]
authors: [msohail22]             # GitHub logins
---
```

Validated by a Zod schema at build time. A bad frontmatter fails the build, so a
malformed pull request cannot merge. That failing build is the entire moderation
system.

### Body contract

The MDX body uses a fixed set of headings so every question reads the same way:

```mdx
## Problem
...prose...

## Constraints
...

## Example
```text
input
```
```text
output
```

## Test cases
...fenced input/output pairs...

<Solution language="cpp">
```cpp
// the accepted solution
```
</Solution>

## Explanation
...why the solution works...
```

`<Solution>` is a client component that renders collapsed with a "Reveal solution"
button. The code is still in the page source — that is accepted, per D2.

## 3. How the questions are loaded

Two globs in `lib/questions.ts`. No filesystem call, at build time or at runtime.

```ts
// index: frontmatter only, eager, so the list page is a pure array
const meta = import.meta.glob('/content/*/*.mdx', {
  eager: true,
  import: 'frontmatter',
});

// bodies: lazy, so each question becomes its own chunk
const bodies = import.meta.glob('/content/*/*.mdx');
```

Why two globs and not one: an eager glob of the bodies would bundle every question's
prose and solution into the chunk that renders the list page. The frontmatter is tiny,
so it is cheap to load all of it. The bodies are not, so they load one at a time.

```
build time                                   request time
──────────                                   ────────────
content/cpp/*.mdx
   │
   │ @mdx-js/rollup + remark-frontmatter
   ▼
JS modules (frontmatter + component)
   │
   │ import.meta.glob
   ▼
questions[] in the bundle  ───────────────▶   /topics/cpp renders from the array
   │                                          (zero I/O)
   └─ lazy chunk per question ───────────▶    /topics/cpp/two-sum imports one chunk
```

Everyday comparison: the frontmatter is the index card in a library catalogue, the
body is the book on the shelf. You load every card to show the list. You fetch one
book only when somebody asks for it.

## 4. Pages

| Route | Auth | What it shows |
|---|---|---|
| `/` | public | The mission statement — "Low Level Lab: a project to learn programming by practice (a lot of practice)" — a one-paragraph what-this-is, and a button to `/topics`. |
| `/topics` | public | Topic cards. Two cards: C++ and Rust. Each card shows the topic name, a one-line description, the question count, and a count per difficulty band. |
| `/topics/[topic]` | public | The question list for that topic, Codeforces-style (see §5). |
| `/topics/[topic]/[slug]` | public | The question. Statement, constraints, example, test cases, reveal-solution, explanation. A "Mark solved" button that prompts sign-in if the visitor has no account. An "Edit on GitHub" link. |
| `/contribute` | public | The frontmatter reference, the heading contract, a copy-paste template, and a link to open a new-question pull request. |
| `/profile` | signed in | Public-ish profile: GitHub avatar, display name, solved count per topic, solved list. |
| `/settings` | signed in | Personalisation: display name, preferred language (C++ or Rust), theme, hide-solved toggle, and sign out. |
| `/login` | public | One GitHub button. |
| `/api/auth/github` + `/api/auth/callback` | public | OAuth start and callback. |
| `/api/solved` | signed in | POST to toggle a solved mark. |

Deliberately absent: no submit box, no judge, no sandbox, no contests, no leaderboard,
no admin panel. The user compiles locally. Removing the judge removes the sandbox,
which is most of the work and all of the security risk.

## 5. The question list box

Modelled on the Codeforces problem list. One table, dense, no cards.

```
┌──────────────────────────────────────────────────────────────────────┐
│ C++                                            24 questions          │
│ [ all ] [ easy 9 ] [ medium 10 ] [ hard 5 ]   [x] hide solved        │
├────┬─────────────────────────────────┬────────────┬────────┬─────────┤
│ #  │ Name                            │ Tags       │ Diff   │ Solved  │
├────┼─────────────────────────────────┼────────────┼────────┼─────────┤
│ 1  │ Reverse a linked list           │ pointers   │ easy   │   ✓     │
│ 2  │ Two sum                         │ hashing    │ easy   │         │
│ …  │                                 │            │        │         │
│ 10 │ Implement a slab allocator      │ memory     │ medium │         │
└────┴─────────────────────────────────┴────────────┴────────┴─────────┘
```

Sort: `difficulty` band (easy, then medium, then hard), then `order` ascending, then
title. The `#` column is the position in that sorted list, computed on render — it is
not stored, so inserting a question renumbers automatically.

The ✓ column is the only part that needs the database. For a signed-out visitor the
column renders empty and the header shows a quiet "sign in to save your progress".

## 6. Data

### D1 schema

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,   -- github:<numeric id>, never the login
  login       TEXT NOT NULL,      -- github login, can change
  name        TEXT,
  avatar_url  TEXT,
  created_at  INTEGER NOT NULL
);

CREATE TABLE settings (
  user_id     TEXT PRIMARY KEY REFERENCES users(id),
  display_name TEXT,
  language    TEXT,               -- 'cpp' | 'rust'
  theme       TEXT,               -- 'system' | 'light' | 'dark'
  hide_solved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE solved (
  user_id     TEXT NOT NULL REFERENCES users(id),
  topic       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  solved_at   INTEGER NOT NULL,
  PRIMARY KEY (user_id, topic, slug)
);
```

`users.id` is the GitHub numeric id, not the login. A login can be renamed and then
claimed by somebody else; the numeric id cannot.

The `solved` table does not reference a questions table. Questions live in git, so
there is nothing to foreign-key against. A deleted question leaves an orphan row,
which is harmless — it is filtered out when the row is joined against the bundled
question index.

### KV

One binding, `RANKING`, created in `cloudflare.config.ts` now and left unused. It is
where the nightly solve-count aggregation will go when the time comes (D3).

### Session

A signed, HTTP-only cookie holding the user id. Signed with an HMAC secret in a
Worker secret. No session table, so sign-out is client-side cookie clearing. Good
enough for a practice site; note it as a known limitation.

## 7. Build order

Each step ends with something that works and can be committed.

1. **Foundation.** Add `@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`,
   `zod`. Wire MDX into `vite.config.ts`. Write `lib/topics.ts`, the Zod schema, and
   `lib/questions.ts` with the two globs. Add three real questions (two C++, one Rust)
   to prove the format before writing fifty.
2. **Shell and home.** Root layout, header, footer, Tailwind base, the mission
   statement on `/`.
3. **Topics.** `/topics` cards and `/topics/[topic]` list box, sorted by band. Fully
   static, no auth. *This is shippable and useful with no account system at all.*
4. **Question page.** `/topics/[topic]/[slug]` with the MDX renderer, the component
   map, and the `<Solution>` reveal.
5. **Auth.** GitHub OAuth app, the two API routes, the session cookie, D1 migrations,
   a header that shows the signed-in user.
6. **Progress.** `/api/solved`, the Mark-solved button, the ✓ column, `/profile`.
7. **Settings.** `/settings` form writing to the `settings` table, and the
   hide-solved and language preferences actually applied to the list.
8. **Contribute.** `/contribute` page, a pull-request template, and a CI job that runs
   the Zod validation so a bad question cannot merge.

## 8. Risks

- `vinext` is beta and its own README says it is "not yet a drop-in replacement" for
  Next.js. Static prerendering of dynamic routes is opt-in via `prerender: true` with
  `staticAssetsAdapter()`. Verify step 4 against a real `pnpm build` early, not at the
  end.
- Manual `@mdx-js/rollup` wiring is not documented for vinext; only `vinext init`
  auto-detection is. If the manual wiring fights the plugin order, the fallback is a
  prebuild script that compiles each MDX to a `.tsx` component. More machinery, but it
  removes the plugin from the equation.
- `node:fs` at request time on Workers is undocumented. The design does not use it.
  Keep it that way.
