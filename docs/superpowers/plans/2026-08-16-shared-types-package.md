# `@llb/shared` Types Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `@llb/shared` with Zod request schemas, inferred types, response DTOs, and shared constants so API and web stop duplicating contracts.

**Architecture:** Zod-first workspace package under `packages/shared`. API imports schemas for validation; web imports types (and schemas for forms where useful). No Drizzle, Hono env, or React prop types in shared.

**Tech Stack:** pnpm workspaces, TypeScript, Zod 4, Vite (web), Wrangler/tsc (api)

**Spec:** `docs/superpowers/specs/2026-08-16-shared-types-package-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `packages/shared/package.json` | Package name, exports, zod dep |
| `packages/shared/tsconfig.json` | Strict ESM types |
| `packages/shared/src/constants.ts` | questionTypes, difficulties, statuses, uiEventNames |
| `packages/shared/src/questions.ts` | create/review/patch schemas + question DTOs |
| `packages/shared/src/learn.ts` | submitAttempt + practice/attempt/leaderboard DTOs |
| `packages/shared/src/platform.ts` | challenge, achievements, sets, glossary, comments, reports |
| `packages/shared/src/study.ts` | mastery, continue, votes, duplicates, ui events, playlist |
| `packages/shared/src/me.ts` | `/api/me` payload |
| `packages/shared/src/index.ts` | Barrel exports |
| `apps/api/package.json` | workspace dep |
| `apps/web/package.json` | workspace dep |
| `apps/api/src/questions/schema.ts` | Re-export from shared (or delete + update imports) |
| `apps/api/src/learn/schema.ts` | Re-export from shared |
| `apps/api/src/routes/*.ts` | Use shared body schemas where inline zod exists |
| `apps/web/src/pages/**/*.tsx` | Import DTOs from `@llb/shared` |

---

### Task 1: Scaffold `@llb/shared`

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts` (empty barrel for now)
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "@llb/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  },
  "dependencies": {
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "typescript": "^6.0.2"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "declaration": true,
    "lib": ["ESNext"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Add workspace deps**

In `apps/api/package.json` and `apps/web/package.json` dependencies:

```json
"@llb/shared": "workspace:*"
```

- [ ] **Step 4: Install**

Run: `pnpm install`  
Expected: lockfile updates; `@llb/shared` linked

- [ ] **Step 5: Commit**

```bash
git add packages/shared apps/api/package.json apps/web/package.json pnpm-lock.yaml
git commit -m "chore: scaffold @llb/shared workspace package"
```

---

### Task 2: Constants + question/learn Zod schemas

**Files:**
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/questions.ts`
- Create: `packages/shared/src/learn.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/src/questions/schema.ts` → re-export from shared
- Modify: `apps/api/src/learn/schema.ts` → re-export from shared

- [ ] **Step 1: Move `questionTypes`, `difficulties`, `createQuestionSchema`, `reviewActionSchema`, `submitAttemptSchema` into shared** (copy from current API files unchanged)

- [ ] **Step 2: Re-export from API schema files**

```ts
export {
  questionTypes,
  difficulties,
  createQuestionSchema,
  reviewActionSchema,
  type CreateQuestionInput,
} from "@llb/shared";
```

```ts
export {
  submitAttemptSchema,
  type SubmitAttemptInput,
} from "@llb/shared";
```

- [ ] **Step 3: Typecheck API**

Run: `pnpm --dir apps/api typecheck`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(shared): move question and attempt Zod schemas"
```

---

### Task 3: Response DTOs + remaining request schemas

**Files:**
- Create/extend: `packages/shared/src/me.ts`, `platform.ts`, `study.ts`, expand `learn.ts` / `questions.ts`
- Modify: API routes that use inline `z.object` for bodies → import shared schemas
- Modify: barrel `index.ts`

Include at minimum:
- `MeResponse`, `PracticeQuestion`, `AttemptResult`, `TopicMastery`, `ContinueState`
- `LeaderboardEntry`, `Achievement`, `GlossaryTerm`, `QuestionSetSummary`
- `DailyChallenge`, `AuthorReputation`, `UiEventInput`, `ingestUiEventsSchema`
- Vote / duplicate / comment / report / set create body schemas extracted from routes

- [ ] **Step 1: Add DTO types matching current web page local types**
- [ ] **Step 2: Extract shared request schemas from study/platform/engagement/questions routes**
- [ ] **Step 3: API typecheck PASS**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat(shared): add DTOs and remaining request schemas"
```

---

### Task 4: Web cutover

**Files:**
- Modify: web pages under `apps/web/src/pages/**` and `hooks/useMe.ts` to `import type { ... } from "@llb/shared"`
- Delete local duplicate `type` aliases that mirror API JSON
- Keep React-only props local

- [ ] **Step 1: Update imports page by page (practice, topics, dashboard, contribute, review, learn extras)**
- [ ] **Step 2: Run `pnpm --dir apps/web exec tsc --noEmit` — PASS**
- [ ] **Step 3: Run `pnpm --dir apps/web lint` — no new errors**
- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(web): consume API contracts from @llb/shared"
```

---

### Task 5: Docs + final verify

**Files:**
- Modify: `docs/to-do-later.md` or AGENTS.md one-liner noting `@llb/shared`
- Modify: design status if needed

- [ ] **Step 1: API typecheck + web tsc + lint**
- [ ] **Step 2: Commit docs**
- [ ] **Step 3: Push if user requested**

---

## Spec coverage checklist

- [x] Zod-first package — Tasks 1–2  
- [x] Constants — Task 2  
- [x] Response DTOs — Task 3  
- [x] API cutover — Tasks 2–3  
- [x] Web cutover — Task 4  
- [x] Verification — Tasks 2–5  
- [x] No Drizzle/Hono/React props — enforced in tasks  

## Notes for executor

- User rule: only `git commit` / `push` when the user asked; this plan includes commits as optional checkpoints — follow the latest user message for commit/push.
- Zod major must stay aligned (`^4.4.3`).
