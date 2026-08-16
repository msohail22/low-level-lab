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
- **packages/ui-tokens** (`@llb/ui-tokens`) — shared design tokens (colors, radii, type)
- **apps/web/src/components/ui** — Radix + CVA web UI kit (Button, Select, etc.)
- **reactor/service** — local Reactor PoC (HTTP + Kafka + Redis + clang++/g++)
- **packages/reactor-sdk** (`@llb/reactor-sdk`) — TS client for Reactor / API proxy
- **docker-compose.yml** + `docker/` — laptop infra (Postgres, Redis, Kafka, Reactor, …)
- **infra/** — Terraform (Cloudflare + cluster/Argo) and k8s manifests Argo syncs

## Commands
Run from repo root unless noted otherwise:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Infra (laptop) | `docker compose up -d` |
| Dev API | `pnpm dev:api` |
| Dev Web | `pnpm dev:web` |
| Dev Reactor | included in `docker compose up` (port 18080) |
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

## Design Tokens & MatteBlack Color System (`@llb/ui-tokens`)
All UI colors, radii, and typography MUST be consumed from `@llb/ui-tokens` (`packages/ui-tokens/src/index.ts`) and corresponding CSS variables generated in `apps/web/src/index.css`.

### MatteBlack Palette (`tahayvr/matteblack.nvim` mapping):
- **Canvas (`bg0`)**: `--canvas` (`#0D0D0D` dark / `#F4F4F5` light) — Deep main background.
- **Surface (`bg1`)**: `--surface` (`#121212` dark / `#FAFAFA` light) — Primary containers & header backdrop.
- **Surface 2 / Panels (`bg3`)**: `--surface-2` (`#212121` dark / `#FFFFFF` light) — Cards, modals, dropdowns.
- **Surface Active (`bg4`)**: `--surface-active` (`#262626` dark / `#E4E4E7` light) — Hover states & active nav pills.
- **Borders & Lines (`bg2`)**: `--line` (`#333333` dark / `#E4E4E7` light) — Card borders & divider lines.
- **Primary Ink (`fg1`)**: `--ink` (`#EAEAEA` dark / `#121212` light) — Primary body text.
- **High-Contrast Bright (`fg0`)**: `--fg-bright` (`#FFFFFF` dark / `#0D0D0D` light) — Headings & active titles.
- **Secondary Text (`fg2`)**: `--fg-secondary` (`#BEBEBE` dark / `#52525B` light) — Subheadings & label text.
- **Muted Text (`fg3`/`comment`)**: `--muted` (`#8A8A8D` dark / `#71717A` light) — Placeholders & subtle captions.
- **Brand Accent (`orange`)**: `--accent` / `--accent-btn` (`#F59E0B` dark / `#D97706` light) — Primary buttons, links, active rings.
- **Text On Accent**: `--on-accent` (`#0D0D0D`).
- **Gold Accent (`gold`)**: `--gold` (`#EFBF04` dark / `#D97706` light) — Leaderboard ranks, high scores, highlight chips.
- **Success (`teal`/`green`)**: `--success` (`#10B981` dark / `#059669` light) — Correct answer badges & complete status.
- **Danger (`crimson`/`red`)**: `--danger` (`#DC2626` dark / `#B91C1C` light) — Incorrect states & delete actions.
- **Warning (`amber`)**: `--warn` (`#D97706` dark / `#B45309` light) — Review due banners & soft alerts.
- **Info (`blue`)**: `--info` (`#3B82F6` dark / `#2563EB` light) — Hint triggers & informational callouts.