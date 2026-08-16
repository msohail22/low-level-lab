# Client Telemetry + Request Logging Design

**Date:** 2026-08-16  
**Status:** Approved for planning  
**Repo:** `msohail22/low-level-lab` (default branch: `master`)

## Goal

Support a shared API for **web and mobile** by:

1. Differentiating clients via an explicit platform header
2. Tracking **devices** per user (separate from Better Auth sessions)
3. Logging **every API request** asynchronously through a **Cloudflare Queue**, then persisting to **Postgres**

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Purpose | Device sessions **and** full request analytics |
| Request coverage | Every API request |
| Ingest path | Cloudflare Queue → Postgres (not sync DB on hot path) |
| Platform detection | Explicit `X-Client-Platform: web \| ios \| android` |
| Device model | Separate `device` table (not only extending `session`) |
| Metadata richness | Rich: platform, IP, UA, parsed browser/OS, device type, CF country/city, app version, request id, latency |
| Retention | Keep forever in v1; pruning documented in `docs/to-do-later.md` |
| Failure mode | Telemetry must never break auth or API responses |

## Current project context

- `apps/api` — Hono Worker, Hyperdrive → Postgres, Drizzle, Better Auth
- Existing auth tables in `apps/api/src/db/schema.ts`: `user`, `session`, `account`, `verification`
- `session` already has `ipAddress` and `userAgent` (Better Auth-managed) — **keep as-is**
- `apps/web` — Vite React SPA + Better Auth client (`apps/web/src/lib/auth.ts`)
- No mobile app in-repo yet; API must accept mobile headers when that client exists
- API routes today: auth (`/api/auth/*`) + `/health`
- Worker entry is Hono-only (`apps/api/src/index.ts` exports the app); will become fetch + queue handler

## Architecture

```text
Web / Mobile client
  │  X-Client-Platform, User-Agent, optional X-App-Version, auth
  ▼
Hono API Worker
  ├─ Better Auth → session.ipAddress / session.userAgent (unchanged)
  ├─ On session create: upsert `device` (rich client meta)
  └─ On every request: middleware builds payload → REQUEST_LOGS_QUEUE.send()
        │
        ▼
Queue consumer (same Worker `queue()` export)
  └─ batch INSERT → Postgres `request_log`
```

## What to add vs reuse

### Reuse (no redesign)

- Better Auth + Drizzle adapter + existing auth tables
- Hyperdrive / Postgres connection (`createDb`)
- Web Better Auth client base URL pattern
- CORS / `trustedOrigins` for browser clients (extend later for mobile deep links if needed)

### Add

| Piece | Purpose |
|-------|---------|
| `device` table | Per-user devices with platform + rich place/client details |
| `request_log` table | Durable analytics row per API request |
| Cloudflare Queue `request-logs` | Buffer so logging is off the hot path |
| Request middleware | Capture meta + enqueue after response |
| Queue consumer | Batch insert into `request_log` |
| Client header helpers | Normalize platform; parse UA; read CF geo |
| Web client headers | Always send `X-Client-Platform: web` (+ optional app version later) |
| Auth `databaseHooks.session.create.after` | Upsert device when a session is created |

### Explicitly later (`docs/to-do-later.md`)

- Request log pruning (Cron + batch delete)
- Admin UI for devices/logs
- Sampling high-volume GETs
- Formal PII / account-deletion export policy
- Dead-letter queue (optional)

## Data model

### `device`

| Column | Type / notes |
|--------|----------------|
| `id` | text PK |
| `userId` | FK → `user.id` cascade |
| `sessionId` | text, nullable, FK → `session.id` set null on delete |
| `platform` | `web` \| `ios` \| `android` \| `unknown` |
| `ipAddress` | text, nullable |
| `userAgent` | text, nullable |
| `browserName` / `browserVersion` | text, nullable |
| `osName` / `osVersion` | text, nullable |
| `deviceType` | text, nullable (`desktop` / `mobile` / `tablet` / …) |
| `country` / `city` | text, nullable (from CF request `cf`) |
| `appVersion` | text, nullable |
| `fingerprint` | text, not null — stable key for upsert (see below) |
| `lastSeenAt` | timestamp |
| `createdAt` / `updatedAt` | timestamps |

**Upsert key:** unique `(userId, fingerprint)` where fingerprint is a short hash of `platform + browserName + osName + deviceType + appVersion` (and raw UA when parse is empty). Prevents unbounded device rows for the same logical client.

**When written:** Better Auth `session.create` **after** hook (primary). Optionally refresh `lastSeenAt` from middleware for authenticated requests (v1: session-create upsert is enough; middleware may update lastSeen if cheap).

### `request_log`

Wide denormalized row (no join required for analytics):

| Column | Notes |
|--------|--------|
| `id` | text PK |
| `createdAt` | timestamp, indexed |
| `requestId` | text (UUID or `cf-ray`) |
| `platform` | same enum as device |
| `method` | text |
| `path` | text (pathname only; no secrets in query — strip or redact `token`/`password` query keys) |
| `statusCode` | integer |
| `latencyMs` | integer |
| `userId` | text, nullable |
| `deviceId` | text, nullable |
| `ipAddress`, `userAgent` | raw |
| `browserName`, `browserVersion`, `osName`, `osVersion`, `deviceType` | parsed |
| `country`, `city` | CF geo |
| `appVersion` | optional header |

Indexes: `createdAt`, `(userId, createdAt)`, `(platform, createdAt)`.

## Client contract

| Header | Required | Values |
|--------|----------|--------|
| `X-Client-Platform` | Preferred | `web`, `ios`, `android` |
| `X-App-Version` | Optional | semver / build string |
| `User-Agent` | Normal | browser or app UA |

Missing/invalid platform → store `unknown`; **do not** fail the request.

Web: configure Better Auth / fetch client to attach `X-Client-Platform: web` on all API calls.  
Mobile (future): same headers on every request.

## Components

### 1. Client meta helper (`apps/api/src/telemetry/client-meta.ts`)

- Read platform + app version from headers
- IP: `cf-connecting-ip` / `x-forwarded-for` fallback
- Geo: `request.cf?.country`, `request.cf?.city` (Workers)
- Parse UA with a small library (e.g. `ua-parser-js`) suitable for Workers
- Produce a typed `ClientMeta` object used by middleware + device upsert

### 2. Request logging middleware (`apps/api/src/telemetry/request-log-middleware.ts`)

- Record `start = Date.now()`
- `await next()`
- Build payload from request + response status + latency + optional session user id if already resolved
- `try { await c.env.REQUEST_LOGS_QUEUE.send(payload) } catch { console.error }` — never throw to client
- Apply on all routes (auth + app routes)

### 3. Queue consumer (`apps/api/src/telemetry/request-log-consumer.ts`)

- Worker `queue(batch, env)` handler
- Validate/normalize bodies
- Batch insert into `request_log`
- On failure: throw / `retry()` so Queue retries; ack on success

### 4. Device upsert (`apps/api/src/telemetry/device.ts`)

- Called from Better Auth `databaseHooks.session.create.after`
- Needs request context for headers/CF — pass via AsyncLocalStorage or capture headers in a Hono middleware that stores `ClientMeta` on context, and read from auth hook via shared store keyed by request
- Practical v1 approach: Hono middleware sets `AsyncLocalStorage` with `ClientMeta` + optional `userId` once known; auth hook and request logger both read it

### 5. Wrangler

- Create queue (e.g. `llb-request-logs`)
- Producer binding `REQUEST_LOGS_QUEUE`
- Consumer binding on same Worker
- Regenerate `CloudflareBindings` via `pnpm --dir apps/api cf-typegen`

### 6. Worker entry (`apps/api/src/index.ts`)

Export:

```ts
export default {
  fetch: app.fetch,
  queue: handleRequestLogQueue,
};
```

## Data flow (request)

1. Client sends request with platform header
2. Middleware starts timer, stores `ClientMeta` in ALS
3. Route / Better Auth handles request
4. On new session: device upsert using ALS meta + session user/session ids
5. Middleware enqueues `RequestLogMessage` (status, latency, path, meta, userId if present)
6. Consumer inserts Postgres rows

## Error handling

| Failure | Behavior |
|---------|----------|
| Queue send fails | Log error; return original response |
| UA parse fails | Leave parsed fields null; keep raw UA |
| Device upsert fails | Log error; session still created |
| Consumer insert fails | Retry batch via Queue |
| Invalid platform header | `unknown` |

## Security / privacy notes

- Do not log request bodies or `Authorization` / cookie header values
- Redact sensitive query params (`password`, `token`, `secret`, etc.)
- IP and geo are PII-ish — pruning / deletion policy deferred to `docs/to-do-later.md`
- `request_log` is append-only analytics, not an authz source of truth

## Testing (implementation plan will detail)

- Unit: platform header normalization, query redaction, fingerprint stability
- Unit/integration: middleware enqueues expected shape (mock Queue)
- Consumer: batch insert mapping
- Manual: `wrangler dev` with queue, hit `/health` + auth, verify Postgres rows

## Success criteria

- Web sends `X-Client-Platform: web` and requests appear in `request_log` with parsed + geo fields when available
- Login creates/updates a `device` row for that user
- API latency is not blocked on Postgres insert for logging
- Missing platform does not break requests
- Existing Better Auth session IP/UA behavior unchanged
