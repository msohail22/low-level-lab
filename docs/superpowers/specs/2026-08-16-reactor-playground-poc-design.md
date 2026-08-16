# Reactor Playground PoC Design

**Date:** 2026-08-16  
**Status:** Approved for planning  
**Repo:** `msohail22/low-level-lab` (default branch: `master`)

## Goal

Ship a **local PoC** for remote C++ execution:

1. A small **runnable Reactor** that accepts jobs over HTTP, queues them on **Kafka**, tracks state in **Redis**, and compiles/runs C++ on the worker
2. A shared **`packages/reactor-sdk`** TypeScript client used by both **API** and **web**
3. Authenticated **`/playground`** page with a reusable **`<ReactorRunner />`** React component

This is intentionally a PoC: real compile/run, async job model (Approach 3), minimal surface area. Not production multi-tenant isolation.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Execution model | Real local `clang++` / `g++` compile + run (not a fake stub) |
| Job model | Async: Kafka queue + Redis job store (existing `reactor/docker` stack) |
| Client access | Both web and API use `reactor-sdk` |
| Playground auth | Logged-in users only |
| UI packaging | Reusable React component (`<ReactorRunner />`), not a custom element |
| Language | C++ only for this PoC |
| Artifacts | Inline stdout/stderr in Redis (no MinIO for PoC) |
| Observability | Existing Prometheus/Grafana/Loki/Tempo left unused for PoC |

## Current project context

- `reactor/` — CMake C++ app that currently compiles a hardcoded `yo.cpp` via `system("clang++...")`; Docker Compose already has reactor, Redis, Kafka, MinIO, and observability placeholders
- `packages/reactor-sdk` — empty package scaffold (`package.json` only)
- `apps/api` — Hono Worker; learn sandbox route stubs full compile/run and only checks `print_output` locally
- `apps/web` — React + Vite; practice sandbox UI talks to `/api/learn/.../sandbox` (not Reactor yet)
- Workers cannot host untrusted code execution; Reactor runs as a separate local/docker process

## Architecture

```text
[Web /playground] --session cookie--> [API Worker]
                                         |
                                         +-- reactor-sdk --> Reactor HTTP
                                              POST /v1/jobs
                                              GET  /v1/jobs/:id

[Reactor HTTP API]
  POST /v1/jobs  -> Redis job (queued) + Kafka produce (reactor.jobs)
  GET  /v1/jobs/:id -> Redis job document

[Reactor worker]
  consume reactor.jobs -> running -> clang++/g++ compile+run (timeout)
                   -> succeeded | failed | timed_out (+ result in Redis)
```

**Preferred Playground path:** browser → authenticated API → SDK → Reactor (cookies stay on API origin).  
**Optional debug path:** `<ReactorRunner />` may point SDK at `VITE_REACTOR_URL` for direct Reactor calls during local debugging (CORS must allow the Vite origin).

## Components

### Reactor (`reactor/`)

**HTTP (PoC)**

| Method | Path | Body / response |
|--------|------|-----------------|
| `POST` | `/v1/jobs` | `{ "language": "cpp", "source": string }` → `{ "id": string, "status": "queued" }` |
| `GET` | `/v1/jobs/:id` | `{ "id", "status", "result?" }` |
| `GET` | `/health` | `{ "ok": true }` |

**Job statuses:** `queued` → `running` → `succeeded` | `failed` | `timed_out`

**Result object (when terminal):**

```json
{
  "stdout": "",
  "stderr": "",
  "exitCode": 0,
  "compiler": "clang++",
  "durationMs": 123
}
```

**Storage**

- Redis key: `reactor:job:{id}` → JSON job document (status + optional result + timestamps)
- Kafka topic: `reactor.jobs` — message body is the job id (or small JSON `{ "id" }`)
- TTL on Redis keys: e.g. 1 hour (PoC)

**Worker behavior**

1. Read job id from Kafka
2. Load job from Redis; set `running`
3. Write source to temp dir; compile with `clang++` preferred else `g++`, `-std=c++17`
4. On compile failure → `failed` with compiler stderr
5. On success → run binary with **3s** wall-clock timeout
6. Write result; set terminal status

**Compose**

- Expose Reactor HTTP on host port **18080** (example)
- Advertise Kafka listener for host clients if the API/SDK runs on the host (document `REACTOR_URL=http://127.0.0.1:18080`)
- Reuse existing Redis (`6379`) and Kafka services; do not require MinIO/observability for PoC success

**Implementation note (PoC):** Prefer one C++ binary that can run in `api` mode (HTTP) and/or `worker` mode (Kafka consumer), or two small targets in the same CMake project. HTTP library choice is an implementation detail (e.g. cpp-httplib) as long as endpoints match this spec.

### `packages/reactor-sdk`

- Package name: **`@llb/reactor-sdk`** (workspace package, same pattern as `@llb/shared`)
- `createReactorClient({ baseUrl, fetch?: typeof fetch, paths?: { submit, get } })`
  - Default paths match Reactor: `POST {baseUrl}/v1/jobs`, `GET {baseUrl}/v1/jobs/:id`
  - API-facing web usage sets `baseUrl` to the API origin and overrides paths to `/api/reactor/jobs` and `/api/reactor/jobs/:id` (or a small `createApiReactorClient` helper that does this)
- Methods: `submitJob({ language: "cpp", source: string })`, `getJob(id)`, `waitForJob(id, { pollMs?, timeoutMs? })`
- Shared TypeScript types matching Reactor JSON
- No UI; pure HTTP client

### `apps/api`

Authenticated (session required):

| Method | Path | Behavior |
|--------|------|----------|
| `POST` | `/api/reactor/jobs` | Validate body; SDK `submitJob` to Reactor `/v1/jobs`; proxy response |
| `GET` | `/api/reactor/jobs/:id` | SDK `getJob` to Reactor; proxy response |

- Env: `REACTOR_URL` (default `http://127.0.0.1:18080` for local)
- **Local PoC only:** API→Reactor assumes Reactor is reachable from the API process (Wrangler local / host networking). Deployed Workers cannot reach a developer’s localhost Reactor without a tunnel — out of scope for this PoC.
- On connection failure → **503** with clear JSON `{ error: "REACTOR_UNAVAILABLE" }`
- Reject source larger than **200KB**
- Do not change existing learn `print_output` sandbox behavior in this PoC (optional follow-up: wire learn sandbox to Reactor later)

### `apps/web`

- Route: `/playground` behind existing `ProtectedRoute`
- Page uses `<ReactorRunner />`
- Component responsibilities:
  - C++ source textarea (sample hello-world default)
  - Run button → SDK configured for **API paths** by default (session cookies via existing API `baseUrl` / fetch wrapper)
  - Poll/wait and render status + stdout/stderr
  - Surface unavailable / timeout / compile errors clearly
- Nav: link to Playground when session present (AppShell or equivalent)
- Optional debug: `VITE_REACTOR_URL` + default `/v1` paths for direct Reactor calls (CORS required; document as debug-only)

## Data flow (happy path)

1. Logged-in user opens `/playground`
2. Clicks Run → `POST /api/reactor/jobs` with source
3. API uses SDK → Reactor creates Redis job + Kafka message → returns `{ id, status: "queued" }`
4. Client `waitForJob` polls `GET /api/reactor/jobs/:id` until terminal
5. UI shows compiler, exit code / timed out, stdout, stderr

## Error handling

| Case | Behavior |
|------|----------|
| Unauthenticated | Web redirect / API 401 |
| Reactor down | API 503; UI “Reactor unavailable” |
| Compile error | Job `failed`; stderr from compiler |
| Run hangs | Job `timed_out` after 3s run limit |
| Source > 200KB | 400 at API and/or Reactor |
| Client poll exceeds budget | SDK stops (~30s default); UI shows poll timeout |
| Unknown job id | 404 |

## Out of scope (PoC)

- Multi-tenant sandboxing / gVisor / Firecracker
- Languages other than C++
- MinIO artifact storage
- Wiring learn-question sandbox to Reactor
- Production auth between API and Reactor (mTLS, API keys)
- Full observability dashboards for jobs
- Desktop / Tauri companion (removed; not returning)

## Success criteria

- `docker compose` (or local Redis+Kafka+Reactor) can accept a job and return real program stdout for a hello-world C++ snippet
- SDK unit/smoke: submit + wait against a running Reactor
- Logged-in user can complete a run on `/playground` via API + SDK
- Clear failure when Reactor is not running

## Follow-ups (later)

- Wire `/api/learn/questions/:id/sandbox` compile path to Reactor via the same SDK
- Harden Reactor auth and isolation for any non-local deploy
- Optional MinIO for large outputs / binaries
