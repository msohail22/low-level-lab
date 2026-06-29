# AGENTS.md — low-level-lab

## Repo Overview
pnpm monorepo with Cloudflare Workers:
- **apps/api** — Hono API (Cloudflare Worker, D1 DB)
- **apps/web** — React + Vite SPA deployed as Cloudflare Worker (assets + worker)
- **shared/** — empty shared package (empty src/)

## Commands
Run from repo root:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev (API + Web) | `pnpm dev` |
| Dev API only | `pnpm dev:api` |
| Dev Web only | `pnpm dev:web` |
| Build all | `pnpm build` |
| Build API | `pnpm build:api` |
| Build Web | `pnpm build:web` |
| Lint API | `pnpm lint:api` |
| Lint Web | `pnpm lint:web` |
| Typecheck API | `pnpm typecheck:api` |
| Deploy all | `pnpm deploy` |
| Deploy API | `pnpm deploy:api` |
| Deploy Web | `pnpm deploy:web` |
| D1 migration (local) | `pnpm db:migrate:local` |
| D1 migration (remote) | `pnpm db:migrate:remote` |

**Note:** `pnpm test` / `pnpm test:mobile` / `pnpm lint:mobile` / `pnpm build:mobile` exist in root `package.json` but `apps/mobile` does not exist — these will fail.

## CI (`.github/workflows/ci.yml`)
Runs on PRs to main:
1. `lint-web` → `build-web`
2. `test-mobile` (fails — no mobile app)
3. `typecheck-api` → `build-api`
4. `lint-mobile` (fails — no mobile app)

## Deploy (`.github/workflows/deploy.yml`)
On push to main:
1. Run D1 migrations (remote)
2. Deploy API (`apps/api`)
3. Deploy Web (`apps/web`)

Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_ID`.

## Key Files
- `apps/api/wrangler.jsonc` — API Worker config (D1 binding `DB`)
- `apps/web/wrangler.jsonc` — Web Worker config (assets + SPA fallback)
- `apps/api/src/db/schema.ts` — Drizzle schema (D1)
- `pnpm-workspace.yaml` — workspace config
- `.env` — local env (not committed)

## Gotchas
- `apps/mobile` referenced in CI/root scripts but **does not exist** — CI jobs fail.
- `shared/src/` is empty — not published or used yet.
- Root `pnpm test` / `test:mobile` / `lint:mobile` / `build:mobile` will fail.
- D1 migrations run via `wrangler d1 migrations apply` (see deploy workflow).
- API uses Hono + Drizzle (D1). Web uses React + Vite + Cloudflare Workers.

## Design Requirements
- **Responsive design mandatory** — all web pages must work on mobile, tablet, desktop, and ultra-wide screens. Use Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) and test across breakpoints.