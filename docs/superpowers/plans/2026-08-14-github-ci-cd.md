# GitHub CI/CD + Master Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CI (lint/build), Cloudflare deploy + Drizzle migrate workflows for `dev`, root scripts, and protect `master` so only `msohail22` can push directly while others need PR approval.

**Architecture:** Split GitHub Actions (`ci.yml` for checks, `deploy.yml` for API → web → migrate). Root `pnpm lint` / `pnpm migrate` wrappers. Branch rules via `gh api`.

**Tech Stack:** GitHub Actions, pnpm, Wrangler, Drizzle Kit, GitHub branch protection API

**Spec:** `docs/superpowers/specs/2026-08-14-github-ci-cd-design.md`

## File map

| File | Responsibility |
|------|----------------|
| `package.json` | Root `lint`, `migrate` scripts |
| `apps/api/package.json` | `migrate` script |
| `apps/web/package.json` | Fix `deploy:dev` to use `build` |
| `.github/workflows/ci.yml` | PR/push lint + build |
| `.github/workflows/deploy.yml` | Deploy API, web, then migrate |
| GitHub branch rules (remote) | Protect `master` |

---

### Task 1: Fix web deploy script + add migrate/lint scripts

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/api/package.json`
- Modify: `package.json`

- [ ] **Step 1: Fix `apps/web` `deploy:dev`**

Change `"deploy:dev": "pnpm run build:dev && wrangler deploy --env dev"` to `"deploy:dev": "pnpm run build && wrangler deploy --env dev"`.

- [ ] **Step 2: Add API migrate script**

In `apps/api/package.json` scripts add: `"migrate": "drizzle-kit migrate"`.

- [ ] **Step 3: Add root lint + migrate**

In root `package.json` scripts add:
```json
"lint": "pnpm --dir apps/web lint && pnpm --dir apps/api typecheck",
"migrate": "pnpm --dir apps/api migrate"
```

- [ ] **Step 4: Commit**

```bash
git add package.json apps/api/package.json apps/web/package.json
git commit -m "chore: add lint/migrate scripts and fix web deploy:dev"
```

---

### Task 2: Add CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create workflow**

```yaml
name: CI

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-and-build:
    name: lint-and-build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint and build workflow for PRs and master"
```

---

### Task 3: Add deploy + migrate workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create workflow**

```yaml
name: Deploy

on:
  push:
    branches: [master]
  workflow_dispatch:

concurrency:
  group: deploy-master
  cancel-in-progress: false

jobs:
  deploy:
    name: deploy-dev
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Deploy API (dev)
        working-directory: apps/api
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: pnpm run deploy:dev
      - name: Deploy Web (dev)
        working-directory: apps/web
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: pnpm run deploy:dev
      - name: Run DB migrations
        working-directory: apps/api
        env:
          DB_URL: ${{ secrets.DB_URL }}
        run: pnpm run migrate
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add Cloudflare deploy and Drizzle migrate workflow"
```

---

### Task 4: Protect master branch

**Remote only (gh api)**

- [ ] **Step 1: Create/update branch protection**

Require: PR + 1 approval, status check `lint-and-build`, restrict pushes to `msohail22`, allow owner bypass for direct push, block force push/deletion.

Use GitHub Rulesets or classic branch protection via `gh api`. Prefer ruleset:

```bash
gh api repos/msohail22/low-level-lab/rulesets --method POST --input - <<'EOF'
{ ... }
EOF
```

Exact JSON filled during execution based on current GitHub API (include bypass actors for user `msohail22`).

- [ ] **Step 2: Verify**

```bash
gh api repos/msohail22/low-level-lab/branches/master/protection
# or
gh api repos/msohail22/low-level-lab/rulesets
```

Expected: only owner can push; PRs need approval; `lint-and-build` required.

---

### Task 5: Document secrets for owner

**Files:**
- Modify: `docs/superpowers/specs/2026-08-14-github-ci-cd-design.md` only if needed; prefer short note in plan completion message

Owner must set repo secrets (no values in git):
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `DB_URL`

- [ ] **Step 1: Confirm secrets missing/present (names only)**

```bash
gh secret list
```

- [ ] **Step 2: Tell owner which to add if missing**

No commit of secret values.

---

## Self-review

- Spec coverage: CI, deploy order, migrate after, scripts, branch protection, secrets — each has a task
- No TBDs left in workflow bodies
- Job name `lint-and-build` matches protection check name
