# AGENTS.md — low-level-lab

## Agent Git Rules
- **Never** run `git add`, `git commit`, `git push`, or amend unless the user explicitly asks in that message.
- The user handles staging and commits themselves.

## Community questions (quick ref)
- Schema: `topic`, `question`, `question_option`, `question_answer`, `question_review`, `attempt`, `attempt_option`, `learning_path`, `learning_path_topic`, `user_learning`, `bookmark`, `spaced_review`
- AuthZ: OpenFGA (`apps/api/openfga/model.fga`); local fallback `REVIEWER_USER_IDS` / `ADMIN_USER_IDS`
- Web: `/paths`, `/topics`, `/practice/:id`, `/due`, `/mistakes`, `/bookmarks`, `/leaderboard`, `/contribute/*`, `/review/*`, `/admin`
- Migrate: `pnpm --dir apps/api migrate` (through `0004_learning_engagement`)

## Repo Overview
pnpm monorepo with Cloudflare Workers:
- **apps/api** — Hono API worker with Postgres/Hyperdrive and Better Auth support
- **apps/web** — React + Vite SPA worker with React Router, React Query, and Better Auth client code
- **packages/shared** (`@llb/shared`) — shared Zod schemas, DTOs, and constants
- **reactor/** — remote code-execution service (sandbox); wire via `packages/reactor-sdk` later
- **packages/reactor-sdk** — client SDK scaffold for Reactor

## Commands
Run from repo root unless noted otherwise:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev API | `pnpm dev:api` |
| Dev Web | `pnpm dev:web` |
| Build web app | `pnpm build` |
| Deploy both apps | `pnpm deploy` |
| Deploy API | `pnpm deploy:api` |
| Deploy Web | `pnpm deploy:web` |
| API typecheck | `pnpm --dir apps/api typecheck` |
| API build / dry-run deploy | `pnpm --dir apps/api build` |
| API local dev deploy | `pnpm --dir apps/api deploy:dev` |
| Web lint | `pnpm --dir apps/web lint` |
| Web build | `pnpm --dir apps/web build` |
| Web dev deploy | `pnpm --dir apps/web deploy:dev` |

## Gotchas
- Root `package.json` does not define `dev`, `build:api`, `build:web`, `lint:api`, `lint:web`, `typecheck:api`, or D1 migration scripts, so use the app-level scripts above for those tasks.
- Root `pnpm test` still targets `apps/mobile`, which does not exist and will fail.
- D1 migrations are handled through Wrangler in `apps/api`.

## Key Files
- `apps/api/wrangler.jsonc` — API Worker config (D1 binding `DB`)
- `apps/web/wrangler.jsonc` — Web Worker config (assets + SPA fallback)
- `apps/api/src/db/schema.ts` — Drizzle schema (D1)
- `packages/shared` (`@llb/shared`) — shared Zod schemas, DTOs, and constants for API + web
- `apps/web/src/routes/index.tsx` — app route map
- `apps/web/src/context/` — app contexts such as auth and theme
- `pnpm-workspace.yaml` — workspace config
- `.env` — local env (not committed)

## Notes
- `packages/shared` (`@llb/shared`) holds cross-app API contracts; do not put Hono env or React component props there.
- API uses Hono + Drizzle (Postgres via Hyperdrive). Web uses React + Vite + Cloudflare Workers.
- Keep custom web CSS centralized in `apps/web/src/index.css`.

## Design Requirements
- **Responsive design mandatory** — all web pages must work on mobile, tablet, desktop, and ultra-wide screens. Use Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) and test across breakpoints.

## Web Styling Rule
- Keep all custom web CSS in `apps/web/src/index.css`.
- Prefer Tailwind utilities in components; use `index.css` for global tokens, resets, shared styles, and reusable patterns.
- Avoid adding separate CSS files for individual components unless there is a strong reason.