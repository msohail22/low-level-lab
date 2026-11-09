# Low Level Lab — build plan

> A project to learn programming by practice (a lot of practice).

**This file is what is true now, and what to do next.** `docs/todo-later.md` is
the parking lot. `docs/arrakis/learning.md` is the history and the reasons.

Rewritten 2026-11-09. The 2026-11-08 version described a plan, and the code has
since gone a different way in several places. Reversed decisions are struck
through, never deleted.

## 1. Decisions

| ID | Decision | Reason |
|---|---|---|
| D1 | Questions are MDX files in this repo. Git is the database. | Contribution = pull request. GitHub's own permissions decide who merges, so there is no RBAC code to write. |
| D2 | The accepted answer lives inside the same question MDX file. | One file per question, nothing to keep in sync. Revealed behind a click. |
| D3 | Difficulty is hard-coded in frontmatter: `easy` / `medium` / `hard`. | No judge exists, so a solve count would be self-reported and gameable. No nightly job, no aggregation. |
| ~~D4~~ | ~~GitHub OAuth is the only sign-in.~~ | **REVERSED.** Shipped as **WorkOS AuthKit** in #60, which fronts GitHub *and* Google. The rest of D4 held: D1 holds per-user rows, and the KV binding exists. |
| ~~D5~~ | ~~Only two topics: C++ and Rust.~~ | **REVERSED.** `apps/web/lib/topics.ts` has `cpp` alone. Rust was never added, and nothing is waiting on it. Topics are still a typed list in code, not a table. |
| D6 | Everything except progress is public. Sign-in is required only to save progress. | A visitor can read every question and every answer without an account. |
| D7 | Content is enumerated with Vite's `import.meta.glob`, never `fs`. | vinext deploys to Cloudflare Workers. `node:fs` is not documented as working at request time, so the design must not need it. |
| D8 | One repository, as a pnpm workspace. | 2026-11-09. `arrakis` and `quarantine` merged in. The site and the engine deploy to different machines, so they are separate packages — but the `.tests.jsonl` contract is written by one and read by the other, and that must change in one reviewable commit. |
| D9 | The execution engine adopts [`isolate`](https://github.com/ioi/isolate). | 2026-11-09. isolate already implements every isolation layer `docs/arrakis/server-plan.md` §5.3 asks for, and is what the IOI grades on. Hand-writing a seccomp filter is how you ship your own CVE. |
| D10 | The engine is C++ only, and runs as a systemd unit — **in a dedicated VM**, not on the host. | 2026-11-09. `cpp` is the one topic that exists. Not a container, because a sandbox inside one must nest namespaces and isolate's man page says containers are "not recommended". Not the host either: a VM is not a container, so that objection never applied to a VM, and an escape on the hypervisor would reach `shieldwall`. The VM is `sietch`, repurposed out of the cluster. See D80 and D83, and A27. |
| D11 | There is no users table. | WorkOS holds identity and the session cookie carries it, so a profile page renders with no database read. A local users table would be a cache that goes stale. |

## 2. Content model

The question format contract — frontmatter fields, required headings, the four
kinds, the test-case rules — lives in **`CLAUDE.md`**, and
`apps/web/scripts/validate-questions.ts` enforces it. It is not repeated here,
because two copies of a contract drift and only one of them is executable.

What matters at plan level:

- One MDX file per question at `apps/web/content/<topic>/<slug>.mdx`. The
  directory is the topic. The filename equals the `slug`.
- Four kinds: `coding`, `mcq`, `multi`, `true-false`. `coding` is compiled
  locally against test cases; the other three are graded in the browser from
  frontmatter.
- `coding` questions carry `<slug>.tests.jsonl` beside the MDX. Test cases are
  never in the body and never in frontmatter.
- The answer is an `<Answer>` block, and it must be the last thing in the file.

Earlier versions of this plan specified `## Constraints`, `## Example`,
`## Explanation` and a `<Solution>` component. All four are gone. The component
is `<Answer>`, and the three headings were removed on purpose — do not
reintroduce them.

## 3. Pages

What exists today, from `apps/web/app/`:

| Route | Auth | What it shows |
|---|---|---|
| `/` | public | The mission statement and a way into `/topics`. |
| `/topics` | public | A card per topic. Name and tagline only — no counts, by the UI rule. |
| `/topics/[topic]` | public | The question list for that topic (§4). |
| `/topics/[topic]/[slug]` | public | The question, its test cases or choices, and the `<Answer>` reveal. |
| `/contribute` | public | The format reference and how to open a pull request. |
| `/me` | signed in | Profile and the three settings. Replaces the planned `/profile` and `/settings` as one page. |
| `/signin`, `/callback`, `/signout` | public | WorkOS AuthKit. Replaces the planned `/login` and `/api/auth/*`. |
| `/me/sync`, `/me/forget` | signed in | Write and clear progress. Replaces the planned `/api/solved`. |
| `/api/settings` | signed in | Write a setting. |

Deliberately absent from the **site**: no submit box, no judge, no sandbox, no
contests, no leaderboard, no admin panel. The reader compiles locally. That is
D6's bargain, and it is why the site can be a static-ish Worker.

The judge is not cancelled — it is `apps/engine`, on a different machine, and
local compiling must keep working without it.

## 4. The question list

One dense table, modelled on the Codeforces problem list. Sort: difficulty band
(easy, medium, hard), then `order` ascending, then title. The `#` column is the
position in that sorted list, computed on render, so inserting a question
renumbers automatically.

Shows 50 rows, then a "Load more" button. Paging caps what is *rendered*: the
index is already in the bundle, unlike test cases which are fetched per chunk.

No counts anywhere — not beside the heading, not on a filter chip. A chip with
nothing behind it is disabled and dimmed, which says the same thing. The one
exception is paging progress ("Showing 50 of 312"), which exists to make the
button mean something.

The ✓ column is the only part that needs the database. Signed out, it renders
empty.

## 5. Data

### D1

One table, `progress`. One row per fact, never a JSON blob per user, so marking
a question solved is a single INSERT that cannot lose a concurrent write from
another tab, and clicking twice is harmless.

```
progress(user_id, kind, key, value, at)
  primary key (user_id, kind, key)
  kind = 'solved'   → key is "<topic>/<slug>", value is NULL
  kind = 'setting'  → key is the setting name, value is the value
  index progress_by_key (kind, key)   -- for a future ranking job
  check  kind in ('solved','setting')
```

`user_id` is the WorkOS id (`user_01H…`), not an email, because an email can
change and the id cannot.

### KV

`PREFS` is a read cache in front of D1 for a reader's settings. D1 stays the
source of truth. Every write updates KV, so a stale entry needs the write
itself to fail — and a miss is only a slower correct answer.

### Settings

Three, in `apps/web/lib/settings-shared.ts`: `theme`, `codeSize`,
`revealAnswers`. The planned display name and preferred-language settings do
not exist. Display name comes from WorkOS, and there is one language.

### Session

WorkOS AuthKit holds the session in a sealed cookie. There is no session table.

## 6. Build order

| # | Work | State |
|---|---|---|
| 1 | Foundation: MDX, Zod schema, the two globs, real questions | **done** |
| 2 | Shell and home | **done** |
| 3 | Topics list and per-topic list | **done** |
| 4 | Question page, component map, `<Answer>` reveal | **done** |
| 5 | Auth | **done** — WorkOS, not GitHub OAuth (D4) |
| 6 | Progress: `/me/sync`, the ✓ column, `/me` | **done** |
| 7 | Settings | **done** — three settings on `/me`, with the KV cache |
| 8 | Contribute page, PR template, CI validation | **done** — `CONTRIBUTING.md`, a pull-request template, two issue forms and a chooser config, plus the CI that enforces them. `/contribute` on the site is still a stub and now points at `CONTRIBUTING.md`. |
| 9 | Brand the sign-in page | not started — T1 |
| 10 | The engine: `isolate`, then a real `/run`, then the VM | **in progress, unblocked.** `isolate` 2.5-1 is installed on the laptop and proven: a program runs, an infinite loop is killed on CPU time, and a memory hog is killed by the cgroup (Q65). `apps/engine` answers `/health` and `/config`; `/run` returns 501 and is the next code. The VM is A27 — reuse `sietch` (D83), so no new RAM and no A9. |

The site is shippable now. Everything left is either polish or the engine.

## 7. Risks

- `vinext` is beta and its own README says it is "not yet a drop-in replacement"
  for Next.js. It does build from a workspace sub-directory — verified
  2026-11-09, 824 ms, 12 routes — but that is not documented, so a vinext
  upgrade is the thing most likely to break the build.
- `node:fs` at request time on Workers is undocumented. The design does not use
  it. Keep it that way.
- The engine is the security surface. Adopting isolate (D9) moves that risk to
  maintained code, but a wrong `--cg` or seccomp configuration still gives
  access to the host. arrakis has no public address and Tailscale carries all
  traffic, which is why this is acceptable for a learning server.
- RAM on arrakis is the binding limit: 8704 MB allocated to four VMs on an
  11690 MB host, measured 2026-11-08. See AB11 in `docs/todo-later.md`. This is
  not on the engine's path, because D83 reuses the idle `sietch` rather than
  building a fifth VM. It binds the *next* thing wanted after that.
