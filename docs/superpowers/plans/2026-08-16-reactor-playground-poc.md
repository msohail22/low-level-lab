# Reactor Playground PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a local async C++ runner (Kafka + Redis + HTTP), `@llb/reactor-sdk`, authenticated API proxy, and `/playground` with `<ReactorRunner />`.

**Architecture:** TypeScript Reactor service under `reactor/service` (PoC-practical Kafka/Redis clients) performs real `clang++`/`g++` compile+run. API and web call it via `@llb/reactor-sdk`. Browser uses session → `/api/reactor/*`.

**Tech Stack:** Node 22, Hono (node), ioredis, kafkajs, pnpm workspace, existing web/API patterns.

---

### Task 1: Reactor HTTP + worker service

**Files:**
- Create: `reactor/service/package.json`, `tsconfig.json`, `src/index.ts`, `src/jobs.ts`, `src/compile.ts`, `src/redis.ts`, `src/kafka.ts`, `Dockerfile`
- Modify: `reactor/docker/compose.yml`, `reactor/README.md`

- [ ] Implement job store + Kafka produce/consume + compile/run
- [ ] Expose `:18080` with `POST /v1/jobs`, `GET /v1/jobs/:id`, `GET /health`
- [ ] Compose service `reactor` builds Node image with clang++

### Task 2: `@llb/reactor-sdk`

**Files:**
- Create/replace: `packages/reactor-sdk/package.json`, `src/index.ts`, `src/types.ts`, `src/client.ts`

- [ ] `createReactorClient` + `submitJob` / `getJob` / `waitForJob`
- [ ] Path overrides for API proxy usage

### Task 3: API routes

**Files:**
- Create: `apps/api/src/routes/reactor.ts`
- Modify: `apps/api/src/routes/index.ts`, `apps/api/package.json`, `apps/api/wrangler.jsonc` (REACTOR_URL)

- [ ] Session-required `POST/GET /api/reactor/jobs`
- [ ] 503 on unreachable Reactor

### Task 4: Web Playground

**Files:**
- Create: `apps/web/src/components/ReactorRunner.tsx`, `apps/web/src/pages/Playground.tsx`
- Modify: `apps/web/src/App.tsx` (or routes), `AppShell`, `package.json`

- [ ] Protected `/playground` + nav link
- [ ] Component uses SDK against API paths

### Task 5: Docs + verify

- [ ] Update `AGENTS.md`, `docs/to-do-later.md`
- [ ] `pnpm install`, typecheck API/web, smoke notes in reactor README
