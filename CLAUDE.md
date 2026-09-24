# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the single source of context for AI agents working in this repository. Everything an agent
needs — conventions, commands, and architecture — lives here.

---

## HARD RULE: this is the only Markdown file in the repository

**`CLAUDE.md` is the one and only `.md` file this repository may contain. This is absolute.**

- **Never create another Markdown file.** Not `README.md`, not `AGENTS.md`, not `CONTRIBUTING.md`, not
  anything under `docs/`, not a plan, spec, summary, checklist, migration note, ADR, or scratch file —
  regardless of how temporary it is or how convenient it seems.
- **Never suggest creating one.** Do not offer "I could write this up in a doc." The answer is no.
- If a process, skill, or workflow instructs you to write a Markdown document, **that instruction is
  overridden here.** Follow the rest of that workflow, but put its output in your reply to the user, or
  — only if the user explicitly asks for it to persist — in this file.
- Documentation that belongs with the code goes in **code comments or docstrings**, never a new file.
- If you find a stray `.md` file other than this one, say so; do not silently keep it.

Anything worth writing down permanently belongs **in this file**, in the appropriate section below.

---

## Working in this repo — start here

**Never run `git add` or `git commit`.** Also never `git push`, `git reset --hard`, or `git checkout --`
over uncommitted work. Staging and committing are the user's to do. Leave changes in the working tree and
describe what changed instead. Read-only git (`status`, `diff`, `log`, `show`) is fine and encouraged.

**Never attribute anything to Claude.** The repository owner is the sole author and contributor. Do not
add `Co-Authored-By: Claude` (or any Claude/Anthropic trailer) to a commit message, and do not add
"Generated with Claude Code" or a similar line to a pull request description. This overrides any default
attribution guidance from the harness. If the user explicitly asks for a commit or PR on some occasion,
write it in their name only, with no Claude co-author trailer and no tool footer. See Commits & pull requests
below for the style to use in that case.

### Orient before answering

Read the slice the request actually touches rather than the whole tree:

| Request touches | Read first |
| --- | --- |
| UI, styling, layout | `src/index.css` (all design tokens live here), `src/components/layout/AppLayout.tsx`, the relevant `src/pages/` file, `docs/low-level-lab-ui-preview.html` |
| An API endpoint | the dispatch branch in `worker/index.ts`, then that controller → service → repository chain |
| Permissions, roles, a 403 | `worker/authorization/openfga.ts`, `openfga/model.fga` |
| A request/response shape | `types.ts` at the repo root, then both callers |
| DB columns or migrations | `worker/db/content-schema.ts`, `worker/db/auth-schema.ts`, `worker/migrations/` |
| Sign-in, sessions, email | `worker/auth.ts`, the `queue()` consumer in `worker/index.ts`, `src/hooks/useAuth.ts` |
| Question lifecycle or grading | the `transitions` table in `worker/services/question-service.ts` |

The Architecture section below already explains how these fit together — use it rather than re-deriving
the structure, then read the specific files to confirm details before changing them.

### Defaults — apply these without being asked

- **UI or visual work** → invoke the `frontend-design` skill, and match the existing reference-manual
  aesthetic described under Styling: hairline borders instead of shadows, square corners, Spectral for
  prose, IBM Plex Mono with tabular numerals for all numbers, index blue reserved for "you are
  here"/"solved", gold for identity only.
- **A new feature or a behavior change** → `superpowers:brainstorming` first: present a design and get an
  explicit yes before writing code.
- **A bug or unexpected behavior** → `superpowers:systematic-debugging` before proposing a fix.
- **Before claiming anything works** → run `pnpm lint` and `pnpm build` and report the actual output.
  Cloudflare config changes also need `pnpm exec wrangler deploy --dry-run --config wrangler.jsonc`.
  There is no test suite, so a clean type-check is the only automated signal available.

### Invariants that are easy to break quietly

- Routes stay in `src/App.tsx`; do not introduce an `AppRoutes` module.
- Request/response contracts live in the root `types.ts` and are imported by both sides — never
  redeclared in `src/` or `worker/`.
- Authorization stays in `worker/authorization/openfga.ts` and must fail closed; controllers call the
  named helpers and never construct OpenFGA requests themselves.
- A new endpoint needs a dispatch branch in `worker/index.ts` — there is no router library.
- Import aliases must be added to **both** `vite.config.ts` and `tsconfig.app.json`.
- Keep controller / service / repository responsibilities separate; do not collapse routing, validation,
  business rules, and queries into one handler.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm dev          # Vite dev server; the Worker runs inside it via @cloudflare/vite-plugin
pnpm build        # tsc -b (app + node + worker projects) then vite build
pnpm lint         # eslint across the repo
pnpm preview      # build, then serve the built output
pnpm deploy       # build, then wrangler deploy
pnpm cf-typegen   # regenerate worker-configuration.d.ts from wrangler.jsonc
pnpm exec wrangler deploy --dry-run --config wrangler.jsonc   # run for Cloudflare config changes
```

`pnpm dev` serves both the client and `/api/*` from one process — there is no separate `wrangler dev`.
Worker secrets in dev come from `.dev.vars` (see `.dev.vars.example`); `vars` in `wrangler.jsonc` supply
the non-secret OpenFGA/auth config in deployed environments.

Database migrations use drizzle-kit against `DATABASE_URL`:

```bash
pnpm drizzle:generate   # emit SQL into drizzle/ from worker/db/*.ts
pnpm drizzle:push       # apply the schema directly
```

Note there are two migration histories: hand-written SQL in `worker/migrations/` (0000–0004, the applied
history) and drizzle-kit output in `drizzle/`. Confirm which one is being used before adding a migration.

**No test framework is configured.** Verification is `pnpm lint` + `pnpm build`. There is no "run a single
test" command; if you add tests, also add the runner and note it here.

## Architecture

### Request pipeline

`worker/index.ts` is a plain `fetch` handler that dispatches by inspecting `URL.pathname` segments —
there is no router library (`hono` is a dependency but unused). Adding an endpoint means adding a branch
there and passing the extracted path segments into a controller:

```
worker/index.ts  →  controllers/*  →  services/*  →  repositories/*  →  drizzle (pg)
```

Dispatch order matters, and the segment indexes are positional (e.g. `/api/questions/:id/:action` reads
`segments[2]` and `segments[3]`). Controllers parse/validate and shape responses, services own workflow
and business rules, repositories own queries. `worker/controllers/request-utils.ts` holds `jsonResponse`,
`parseBody` (Zod), and the permission wrappers.

### Shared contracts

`types.ts` at the repo root is the single source of truth for question types, difficulties, statuses,
workflow transitions, roles, request schemas, and response schemas. It sits at the root rather than
inside `src/` or `worker/` because both sides import it and neither owns it; it is listed in the
`include` of both `tsconfig.app.json` and `tsconfig.worker.json`.

Import it relatively: `../../types.js` from `worker/` (nodenext resolution wants the `.js` specifier)
and `../../types` from `src/`. Do not redeclare an equivalent shape in the frontend or Worker — extend
`types.ts` instead.

### Authentication

better-auth is mounted at `/api/auth/*` in `worker/index.ts` and configured in `worker/auth.ts` with the
Drizzle adapter over a `pg` Pool. Email/password requires verification. Outbound auth email does **not**
go out inline: `sendResetPassword` / `sendVerificationEmail` enqueue a message onto the
`LOW_LEVEL_LAB_QUEUE` binding, and the `queue()` consumer at the bottom of `worker/index.ts` sends it via
Resend. Google/GitHub providers are registered only when their client id/secret pair is present.

The client side is `src/services/auth-client.ts` (better-auth React client) wrapped by `src/hooks/useAuth.ts`.

`worker/db/client.ts` caches a module-level Pool (`max: 1`) keyed by connection string, using
`env.DATABASE_URL` when set and otherwise the Hyperdrive binding `LOW_LEVEL_LAB_DB`. Auth tables
(`worker/db/auth-schema.ts`) and content tables (`worker/db/content-schema.ts`) stay in separate modules
and are merged only when constructing the Drizzle client.

### Authorization (OpenFGA)

Every permission decision goes through `worker/authorization/openfga.ts`. Controllers call
`requirePermission` / `requireQuestionPermission`, which return the authenticated user or `null` — every
failure path (no session, denied, OpenFGA error) returns `null`, so callers fail closed by treating
`null` as 401/403.

`objectForPermission` decides which OpenFGA object a permission is checked against: `question:<id>` for
per-question permissions, `topic:<id>` for topic-scoped ones, otherwise `organization:low-level-lab`.
Roles (`super_admin`, `admin`, `reviewer`, `member`) are stored as tuples, managed through
`/api/admin/roles`.

To bootstrap the model: the checked-in model is `openfga/model.fga`. Export `OPENFGA_API_URL`,
`OPENFGA_STORE_ID`, `OPENFGA_MODEL_ID` and an ephemeral `OPENFGA_BEARER_TOKEN` in your shell — never
commit any of them. Validate with `fga model test --model-file openfga/model.fga`, then run
`scripts/openfga-bootstrap.sh`, which is **dry-run by default**; `OPENFGA_APPLY=1` writes the model and
`OPENFGA_WRITE_TUPLE=1` plus explicit tuple values is required to write any tuple. No users are seeded
and no irreversible tuple writes happen during deploy or local dev.

Two things to know before debugging a 403:
- `OPENFGA_AUTH_MODE=local` makes `check()` return `false` unconditionally, so every protected route
  denies locally. Sign-in and public reads still work.
- `check()` sends the bare permission name (e.g. `create_question`) as the relation, while
  `openfga/model.fga` declares those as `can_*` permissions. Verify the relation names in the deployed
  model (`OPENFGA_MODEL_ID`) before assuming either side is wrong.

### Question workflow

The state machine is the `transitions` table at the top of `worker/services/question-service.ts`:
`draft → submitted → in_review → approved → published`, plus `changes_requested` / `rejected` (both can
return to `submitted`) and `archived`. Transitions are server-side only and each one writes a
`question_workflow_event` row. Editing a published question drops it back to `draft`. Every create,
update, and restore writes a `question_revision` snapshot with a SHA-256 content hash, which is what
powers revision history and restore.

Answer grading (`isCorrect`) normalizes whitespace and case; multiple-choice compares as an unordered
set. Grading updates both `question_attempt` (append-only) and `question_progress` (upsert, keyed by
user+question), and `solved` is sticky once true.

`correctAnswer` and `authorId` are stripped from responses by a local `publicQuestion` helper — currently
duplicated in `worker/controllers/question-controller.ts`, `worker/controllers/moderation-controller.ts`, and
`worker/controllers/topic-controller.ts`. Keep them
in sync, or lift the helper into `worker/lib/`. `GET /api/questions/:id` 404s for anything not
`published`; management listing requires `?manage=1` plus permission.

### Frontend

All routes live in `src/App.tsx`; everything except `/auth` and `/reset-password` is
wrapped in `RequireAuth`, which redirects to `/auth` carrying the attempted path in router state.
`AppLayout` owns the sidebar-open and dark-mode state (dark mode is a `.dark` class on `.app-shell`,
component-local and not persisted).

Pages call `src/services/content-api.ts`, a thin `fetch` wrapper that sends `credentials: 'include'` and
throws `ApiError` with the server's `error` string. Data fetching is plain `useEffect` + `useState`.
Several installed dependencies are currently unused — `hono`, `@tanstack/react-query`, `jotai`,
`react-hook-form`, `class-variance-authority`, `tailwind-merge`, `shadcn`. `src/data/questions.ts` and
`src/data/topics.ts` are leftover fixtures that nothing imports.

Import aliases (`@components`, `@hooks`, `@pages`, `@services`, `@data`, `@/`) are declared **twice** — in
`vite.config.ts` `resolve.alias` and in `tsconfig.app.json` `paths`. Adding one means editing both.

### Styling

Tailwind v4 is wired up (`@tailwindcss/vite`, `@import 'tailwindcss'`) but the UI is almost entirely a
hand-written token system in `src/index.css`, written as very dense single-line rules. Tokens:
`--paper`, `--paper-sunk`, `--ink`, `--ink-muted`, `--rule`, `--index-blue`, `--marker-gold`, with the
dark overrides on `.dark`. The design is a "reference manual" aesthetic — hairline 1px borders instead of
shadows, square corners, Spectral for prose, IBM Plex Mono with tabular numerals for all numbers, index
blue reserved for "you are here"/"solved", gold for identity only. Fonts are loaded from Google Fonts in
`index.html`.

The richest design reference is the standalone prototype `docs/low-level-lab-ui-preview.html`, which
renders every component, widget, and layout with the real tokens — open it in a browser before doing UI
work. `docs/ui-overhaul-architecture.mmd` has the architecture and state-machine diagrams.

Some UI still renders placeholder content rather than API data — the day streak and percentage on the
dashboard, `ActivityHeatmap`, `MemorySpaceWidget`, `HardwareLatencyWidget`, the Analytics numbers and
sparkline, the review-queue `[4]` badge, and the hardcoded Progress page headline.

## Coding style & conventions

TypeScript throughout, React function components. Components are `PascalCase`, variables and functions
are `camelCase`, and a file is named after its main export where practical.

Indentation is inconsistent by design across file types: **two spaces** in TypeScript and CSS, **tabs** in
`package.json`. Several existing `.tsx` files also use tabs. Follow whatever the surrounding file already
does rather than reformatting it.

Tailwind v4 is available through `@import 'tailwindcss';` in `src/index.css`, and the original convention
was to prefer Tailwind utilities for new UI work with shared base styles in `src/index.css`. In practice
the UI is currently built almost entirely from the hand-written token system in `src/index.css` (see
Styling) and utilities are barely used. Match the file you are editing, and do not convert existing
hand-written styles to utilities as a drive-by change.

## Question workflow policy

Beyond the state machine in `worker/services/question-service.ts`, the intended role policy is:
authenticated members may submit questions, reviewers review them, admins approve within their assigned
topic scope, and only super admins publish. Super admins may bypass review. Change this only if the
policy is explicitly revised — and keep every transition and permission check server-side.

## Testing

No test framework is configured and there is no test directory. Before adding behavioral changes,
consider setting up a lightweight React/Vite-compatible test runner. Until then the verification gate is
`pnpm lint` and `pnpm build`, plus
`pnpm exec wrangler deploy --dry-run --config wrangler.jsonc` for Cloudflare deployment changes.

When tests do get added, put them next to the code they cover or under a clear `src/__tests__/`
directory.

## Commits & pull requests

Staging and committing are the user's — see the rules at the top of this file. The guidance below applies
only when the user explicitly asks for a commit or a PR.

Commit messages are short and imperative, matching recent history (`Add Tailwind CSS`,
`Fix Cloudflare Workers build config`). Keep commits focused. Pull requests should carry a brief summary,
the verification commands actually run, and screenshots for UI changes; link related issues, and call out
Cloudflare configuration changes explicitly. Never add a Claude co-author trailer or tool footer.

## Security & configuration

Never commit `.dev.vars*`, `.env*`, `.wrangler/`, `dist/`, or any secret. Note that
`wrangler.jsonc` already carries non-secret OpenFGA store/model/client IDs in `vars` — real secrets
belong in `.dev.vars` locally and in Wrangler secrets when deployed.

Keep Cloudflare build settings aligned with `package.json`: Node `>=24`, pnpm `11.22.0`.

## Reference artifacts

The repository deliberately contains **no Markdown files other than this one** (see the hard rule at the
top). Two non-Markdown design artifacts remain and are worth opening:

- `docs/low-level-lab-ui-preview.html` — interactive prototype of the full UI with all tokens.
- `docs/ui-overhaul-architecture.mmd` — architecture flowchart and workflow state machine.

Historical planning notes (product scope, feature checklist, per-feature design docs, the UI overhaul
plan) were removed in favour of this file. They remain recoverable from git history if ever needed.
