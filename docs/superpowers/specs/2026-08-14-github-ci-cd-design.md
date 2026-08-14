# GitHub CI/CD + Master Protection Design

**Date:** 2026-08-14  
**Status:** Approved for planning  
**Repo:** `msohail22/low-level-lab` (default branch: `master`)

## Goal

Add GitHub Actions for PR quality checks, Cloudflare Worker deploys (web + API) to the existing `dev` Wrangler environment, Postgres migrations via Drizzle after deploys, and branch protection so only the owner can push directly to `master` while everyone else must use approved PRs.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Deploy trigger | Auto on push/merge to `master` **and** manual `workflow_dispatch` |
| Migration timing | **After** API and web deploys succeed |
| Cloudflare target | `--env dev` only for now |
| PR checks | `pnpm lint` and `pnpm build` |
| Direct push to `master` | Only `msohail22`; contributors cannot push directly |
| PR merge gate | Requires approval from `msohail22` |
| Workflow layout | Split workflows (CI separate from deploy) |

## Current project context

- Monorepo with `pnpm` (`packageManager: pnpm@10.30.0`)
- `apps/api` — Hono Worker, Hyperdrive → Postgres, Drizzle (`drizzle.config.ts` uses `DB_URL`)
- `apps/web` — Vite React SPA Worker; has `lint` and `build` scripts
- Root already has `build` → web build; **no root `lint` yet**
- Deploy scripts today: `deploy:api` / `deploy:web` → Wrangler `--env dev`
- No `.github/workflows` yet
- Migrations live in `apps/api/drizzle/`; applied with Drizzle Kit against Postgres (not D1)

## Architecture

```text
PR opened / updated
  └─ ci.yml → install → pnpm lint → pnpm build

Push to master (or manual dispatch)
  └─ deploy.yml
       1. deploy API (--env dev)
       2. deploy web (--env dev)
       3. migrate DB (drizzle-kit migrate via DB_URL)
```

CI also runs on push to `master` so required status checks exist for branch protection and the same gate applies to owner pushes when checks are required on the branch.

## Components

### 1. Root scripts (`package.json`)

Add scripts so CI can call what the user asked for:

- `lint` — run web ESLint (`pnpm --dir apps/web lint`) and API typecheck (`pnpm --dir apps/api typecheck`)
- Keep existing `build` (web build)
- Add root `migrate` — delegates to `apps/api` migrate script (uses `DB_URL`)
- Add `apps/api` script `migrate` — `drizzle-kit migrate`

`pnpm build` remains web-focused as today. Deploy workflow uses `deploy:api` / `deploy:web` (dev env).

**Prerequisite fix:** `apps/web` `deploy:dev` currently calls `build:dev`, which is not defined. Change it to `pnpm run build && wrangler deploy --env dev` so CI/CD deploy does not fail.

### 2. `.github/workflows/ci.yml`

**Triggers:** `pull_request` (to `master`), `push` (to `master`)

**Job name (required check):** `lint-and-build`

**Steps:**

1. Checkout
2. Setup pnpm + Node 22
3. `pnpm install --frozen-lockfile`
4. `pnpm lint`
5. `pnpm build`

No Cloudflare credentials required. Fail the job on any non-zero exit.

### 3. `.github/workflows/deploy.yml`

**Triggers:**

- `push` to `master`
- `workflow_dispatch` (manual “deploy now”)

**Jobs (sequential):**

1. **Deploy API** — `pnpm --dir apps/api deploy:dev` with Cloudflare auth
2. **Deploy Web** — `pnpm --dir apps/web deploy:dev` (includes web build) with Cloudflare auth
3. **Migrate** — set `DB_URL` from secret, run Drizzle migrate against Postgres

If any step fails, stop (no migrate if deploy failed). Migrations never run before workers are updated.

**Concurrency:** one deploy at a time for `master` (cancel-in-progress optional; prefer queue/serialize to avoid overlapping migrates).

### 4. Secrets / variables (GitHub repo)

| Name | Purpose |
|------|---------|
| `CLOUDFLARE_API_TOKEN` | Wrangler deploy auth |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |
| `DB_URL` | Postgres connection string for `drizzle-kit migrate` |

Document these in the design/README snippet; do not commit secret values. Owner must create the token/URL in GitHub Settings → Secrets before first successful deploy.

### 5. Branch protection on `master`

Configured via GitHub API / `gh` (not committed YAML — rules live in GitHub settings):

- Restrict who can push to matching branches → only `msohail22`
- Require a pull request before merging
- Require at least **1** approving review (owner must approve contributor PRs)
- Require status checks to pass: `lint-and-build` (job name from `ci.yml`)
- Allow `msohail22` to bypass required pull requests so they can still push directly to `master`
- Do not allow force pushes or branch deletion for others (disable force push / deletion on the rule)

**Effect:**

- Contributors cannot push directly to `master`
- Contributors open PRs; merge only after your approval + green CI
- You can push directly when you choose

## Error handling

- CI failures block PR merge via required checks
- Deploy job failure stops the workflow; migrate does not run
- Migrate failure leaves workers already deployed; fix forward with a follow-up migration or manual `workflow_dispatch` after repair (acceptable for now; no automatic rollback)

## Out of scope

- Production Wrangler env / multi-environment promotion
- D1 migrations (project uses Postgres + Hyperdrive)
- Mobile app CI
- SonarQube in Actions
- Automatic Cloudflare secret sync beyond the three GitHub secrets above

## Testing / verification

1. Open a PR → CI runs lint + build
2. Confirm contributor cannot push to `master` (protection rules visible in repo settings)
3. Merge approved PR or push as owner → deploy workflow runs API → web → migrate
4. Trigger “Run workflow” manually → same deploy path
5. Missing secret → deploy/migrate fails clearly in Actions logs

## Success criteria

- [ ] `ci.yml` and `deploy.yml` exist and match the triggers above
- [ ] Root `pnpm lint` and `pnpm build` work in CI
- [ ] Deploy uses `--env dev` only
- [ ] Migrations run only after both deploys succeed
- [ ] `master` is protected: only owner direct-push; others need your PR approval
- [ ] Required secrets documented for the owner to set in GitHub
