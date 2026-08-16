# Client Telemetry + Request Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add platform-aware device tracking and async every-request logging (Cloudflare Queue → Postgres) for web and future mobile clients.

**Architecture:** Hono middleware captures client meta and enqueues to `REQUEST_LOGS_QUEUE`; the same Worker’s `queue()` consumer batch-inserts into `request_log`. Better Auth `session.create` after-hook upserts a `device` row. Web client always sends `X-Client-Platform: web`.

**Tech Stack:** Hono, Better Auth, Drizzle, Postgres (Hyperdrive), Cloudflare Queues, `ua-parser-js`, Vitest (API unit tests)

**Spec:** `docs/superpowers/specs/2026-08-16-client-telemetry-request-logging-design.md`

**Deferred:** `docs/to-do-later.md` (pruning, admin UI, sampling, PII policy)

## File map

| File | Responsibility |
|------|----------------|
| `apps/api/src/db/schema.ts` | Add `device` + `request_log` tables and relations |
| `apps/api/drizzle/*` | Generated migration for new tables |
| `apps/api/src/telemetry/types.ts` | Shared payload / platform types |
| `apps/api/src/telemetry/client-meta.ts` | Headers, IP, CF geo, UA parse, fingerprint |
| `apps/api/src/telemetry/context.ts` | AsyncLocalStorage for request-scoped meta |
| `apps/api/src/telemetry/device.ts` | Upsert device on session create |
| `apps/api/src/telemetry/request-log-middleware.ts` | Enqueue after each request |
| `apps/api/src/telemetry/request-log-consumer.ts` | Queue → Postgres batch insert |
| `apps/api/src/telemetry/*.test.ts` | Unit tests |
| `apps/api/src/auth/index.ts` | Session create hook → device upsert |
| `apps/api/src/app.ts` | Mount telemetry middleware + ALS |
| `apps/api/src/index.ts` | Export `fetch` + `queue` |
| `apps/api/wrangler.jsonc` | Queue producer + consumer bindings |
| `apps/api/package.json` | `ua-parser-js`, vitest scripts |
| `apps/web/src/lib/auth.ts` | Send `X-Client-Platform: web` |

---

### Task 1: Add Vitest + telemetry types + client-meta helpers (TDD)

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/src/telemetry/types.ts`
- Create: `apps/api/src/telemetry/client-meta.ts`
- Create: `apps/api/src/telemetry/client-meta.test.ts`

- [ ] **Step 1: Add test + UA parser deps**

```bash
pnpm --dir apps/api add ua-parser-js
pnpm --dir apps/api add -D vitest @types/ua-parser-js
```

In `apps/api/package.json` scripts add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Add Vitest config**

Create `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Write failing tests for platform + path redaction**

Create `apps/api/src/telemetry/client-meta.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  normalizePlatform,
  redactPath,
  buildFingerprint,
} from "./client-meta.ts";

describe("normalizePlatform", () => {
  it("accepts web ios android", () => {
    expect(normalizePlatform("web")).toBe("web");
    expect(normalizePlatform("IOS")).toBe("ios");
    expect(normalizePlatform("android")).toBe("android");
  });

  it("falls back to unknown", () => {
    expect(normalizePlatform(null)).toBe("unknown");
    expect(normalizePlatform("desktop")).toBe("unknown");
  });
});

describe("redactPath", () => {
  it("strips sensitive query keys", () => {
    expect(redactPath("/api/x?token=abc&ok=1")).toBe("/api/x?ok=1");
    expect(redactPath("/health")).toBe("/health");
  });
});

describe("buildFingerprint", () => {
  it("is stable for same inputs", async () => {
    const a = await buildFingerprint({
      platform: "web",
      browserName: "Chrome",
      osName: "macOS",
      deviceType: "desktop",
      appVersion: null,
      userAgent: "Mozilla/5.0",
    });
    const b = await buildFingerprint({
      platform: "web",
      browserName: "Chrome",
      osName: "macOS",
      deviceType: "desktop",
      appVersion: null,
      userAgent: "Mozilla/5.0",
    });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });
});
```

- [ ] **Step 4: Run tests — expect FAIL**

```bash
pnpm --dir apps/api test
```

Expected: FAIL (module / exports missing)

- [ ] **Step 5: Implement types + client-meta**

Create `apps/api/src/telemetry/types.ts`:

```ts
export type ClientPlatform = "web" | "ios" | "android" | "unknown";

export type ClientMeta = {
  platform: ClientPlatform;
  appVersion: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  deviceType: string | null;
  country: string | null;
  city: string | null;
  requestId: string;
};

export type RequestLogMessage = ClientMeta & {
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  userId: string | null;
  deviceId: string | null;
  createdAt: string; // ISO
};
```

Create `apps/api/src/telemetry/client-meta.ts`:

```ts
import { UAParser } from "ua-parser-js";
import type { ClientMeta, ClientPlatform } from "./types.ts";

const SENSITIVE_QUERY_KEYS = new Set([
  "password",
  "token",
  "secret",
  "access_token",
  "refresh_token",
  "code",
]);

export function normalizePlatform(
  value: string | null | undefined,
): ClientPlatform {
  const v = value?.trim().toLowerCase();
  if (v === "web" || v === "ios" || v === "android") return v;
  return "unknown";
}

export function redactPath(pathWithQuery: string): string {
  const qIndex = pathWithQuery.indexOf("?");
  if (qIndex === -1) return pathWithQuery;
  const pathname = pathWithQuery.slice(0, qIndex);
  const params = new URLSearchParams(pathWithQuery.slice(qIndex + 1));
  for (const key of [...params.keys()]) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) params.delete(key);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export async function buildFingerprint(input: {
  platform: ClientPlatform;
  browserName: string | null;
  osName: string | null;
  deviceType: string | null;
  appVersion: string | null;
  userAgent: string | null;
}): Promise<string> {
  const raw = [
    input.platform,
    input.browserName ?? "",
    input.osName ?? "",
    input.deviceType ?? "",
    input.appVersion ?? "",
    input.userAgent ?? "",
  ].join("|");
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export function extractClientMeta(request: Request): ClientMeta {
  const headers = request.headers;
  const userAgent = headers.get("user-agent");
  const platform = normalizePlatform(headers.get("x-client-platform"));
  const appVersion = headers.get("x-app-version");
  const ipAddress =
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  const cf = (request as Request & { cf?: CfProperties }).cf;
  const parser = new UAParser(userAgent ?? undefined);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  return {
    platform,
    appVersion: appVersion?.trim() || null,
    ipAddress,
    userAgent,
    browserName: browser.name ?? null,
    browserVersion: browser.version ?? null,
    osName: os.name ?? null,
    osVersion: os.version ?? null,
    deviceType: device.type ?? (platform === "web" ? "desktop" : "mobile"),
    country: typeof cf?.country === "string" ? cf.country : null,
    city: typeof cf?.city === "string" ? cf.city : null,
    requestId: headers.get("cf-ray") ?? crypto.randomUUID(),
  };
}
```

If `CfProperties` is not in scope, use a local type:

```ts
type CfProperties = { country?: string; city?: string };
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
pnpm --dir apps/api test
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/package.json apps/api/pnpm-lock.yaml pnpm-lock.yaml apps/api/vitest.config.ts apps/api/src/telemetry/
git commit -m "feat(api): add client meta helpers and telemetry unit tests"
```

---

### Task 2: AsyncLocalStorage context + schema tables

**Files:**
- Create: `apps/api/src/telemetry/context.ts`
- Modify: `apps/api/src/db/schema.ts`
- Generate: `apps/api/drizzle/0001_*.sql` (name from drizzle-kit)

- [ ] **Step 1: Create request context store**

Create `apps/api/src/telemetry/context.ts`:

```ts
import { AsyncLocalStorage } from "node:async_hooks";
import type { ClientMeta } from "./types.ts";

export type TelemetryStore = {
  meta: ClientMeta;
  userId: string | null;
  deviceId: string | null;
};

export const telemetryAls = new AsyncLocalStorage<TelemetryStore>();

export function getTelemetryStore(): TelemetryStore | undefined {
  return telemetryAls.getStore();
}

export function setTelemetryUserId(userId: string | null): void {
  const store = telemetryAls.getStore();
  if (store) store.userId = userId;
}

export function setTelemetryDeviceId(deviceId: string | null): void {
  const store = telemetryAls.getStore();
  if (store) store.deviceId = deviceId;
}
```

- [ ] **Step 2: Extend Drizzle schema**

Append to `apps/api/src/db/schema.ts` (keep existing Better Auth tables unchanged). Add imports if needed: `integer` from `drizzle-orm/pg-core`.

```ts
export const device = pgTable(
  "device",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    platform: text("platform").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    browserName: text("browser_name"),
    browserVersion: text("browser_version"),
    osName: text("os_name"),
    osVersion: text("os_version"),
    deviceType: text("device_type"),
    country: text("country"),
    city: text("city"),
    appVersion: text("app_version"),
    fingerprint: text("fingerprint").notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("device_userId_idx").on(table.userId),
    index("device_user_fingerprint_uidx").on(table.userId, table.fingerprint),
  ],
);

export const requestLog = pgTable(
  "request_log",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    requestId: text("request_id").notNull(),
    platform: text("platform").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    statusCode: integer("status_code").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    userId: text("user_id"),
    deviceId: text("device_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    browserName: text("browser_name"),
    browserVersion: text("browser_version"),
    osName: text("os_name"),
    osVersion: text("os_version"),
    deviceType: text("device_type"),
    country: text("country"),
    city: text("city"),
    appVersion: text("app_version"),
  },
  (table) => [
    index("request_log_createdAt_idx").on(table.createdAt),
    index("request_log_userId_createdAt_idx").on(table.userId, table.createdAt),
    index("request_log_platform_createdAt_idx").on(
      table.platform,
      table.createdAt,
    ),
  ],
);

export const deviceRelations = relations(device, ({ one }) => ({
  user: one(user, { fields: [device.userId], references: [user.id] }),
  session: one(session, {
    fields: [device.sessionId],
    references: [session.id],
  }),
}));
```

Also extend `userRelations` to include `devices: many(device)`.

Add a **unique** constraint on `(userId, fingerprint)` — prefer:

```ts
uniqueIndex("device_user_fingerprint_uidx").on(table.userId, table.fingerprint),
```

Import `uniqueIndex` / `integer` from `drizzle-orm/pg-core`.

- [ ] **Step 3: Generate migration**

```bash
pnpm --dir apps/api exec drizzle-kit generate --name client_telemetry
```

Expected: new SQL under `apps/api/drizzle/` creating `device` and `request_log`.

- [ ] **Step 4: Apply migration locally (when DB_URL is set)**

```bash
pnpm --dir apps/api migrate
```

If local DB is not up, note in commit message and apply when available; schema + migration files must still be committed.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/src/telemetry/context.ts apps/api/drizzle/
git commit -m "feat(api): add device and request_log schema"
```

---

### Task 3: Device upsert + auth session hook

**Files:**
- Create: `apps/api/src/telemetry/device.ts`
- Modify: `apps/api/src/auth/index.ts`

- [ ] **Step 1: Implement upsertDevice**

Create `apps/api/src/telemetry/device.ts`:

```ts
import { and, eq } from "drizzle-orm";

import { createDb } from "../db/index.ts";
import { device } from "../db/schema.ts";
import { buildFingerprint } from "./client-meta.ts";
import { getTelemetryStore, setTelemetryDeviceId } from "./context.ts";

export async function upsertDeviceForSession(opts: {
  hyperdrive: Hyperdrive;
  userId: string;
  sessionId: string;
}): Promise<string | null> {
  const store = getTelemetryStore();
  const meta = store?.meta;
  if (!meta) return null;

  try {
    const db = createDb(opts.hyperdrive);
    const fingerprint = await buildFingerprint({
      platform: meta.platform,
      browserName: meta.browserName,
      osName: meta.osName,
      deviceType: meta.deviceType,
      appVersion: meta.appVersion,
      userAgent: meta.userAgent,
    });

    const existing = await db
      .select()
      .from(device)
      .where(
        and(
          eq(device.userId, opts.userId),
          eq(device.fingerprint, fingerprint),
        ),
      )
      .limit(1);

    const now = new Date();
    if (existing[0]) {
      await db
        .update(device)
        .set({
          sessionId: opts.sessionId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          browserName: meta.browserName,
          browserVersion: meta.browserVersion,
          osName: meta.osName,
          osVersion: meta.osVersion,
          deviceType: meta.deviceType,
          country: meta.country,
          city: meta.city,
          appVersion: meta.appVersion,
          platform: meta.platform,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(device.id, existing[0].id));
      setTelemetryDeviceId(existing[0].id);
      return existing[0].id;
    }

    const id = crypto.randomUUID();
    await db.insert(device).values({
      id,
      userId: opts.userId,
      sessionId: opts.sessionId,
      platform: meta.platform,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      browserName: meta.browserName,
      browserVersion: meta.browserVersion,
      osName: meta.osName,
      osVersion: meta.osVersion,
      deviceType: meta.deviceType,
      country: meta.country,
      city: meta.city,
      appVersion: meta.appVersion,
      fingerprint,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    });
    setTelemetryDeviceId(id);
    return id;
  } catch (err) {
    console.error("device upsert failed", err);
    return null;
  }
}
```

- [ ] **Step 2: Wire Better Auth hook**

Update `apps/api/src/auth/index.ts` to pass `env` into hooks and call upsert after session create:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { createDb } from "../db/index.ts";
import * as schema from "../db/schema.ts";
import { getTrustedOrigins } from "./config.ts";
import { upsertDeviceForSession } from "../telemetry/device.ts";

export function createAuth(env: CloudflareBindings) {
  const db = createDb(env.HYPERDRIVE);

  return betterAuth({
    appName: "Low-Level Lab",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: getTrustedOrigins(env),
    emailAndPassword: {
      enabled: true,
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            await upsertDeviceForSession({
              hyperdrive: env.HYPERDRIVE,
              userId: session.userId,
              sessionId: session.id,
            });
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --dir apps/api typecheck
```

Expected: PASS (or only pre-existing unrelated errors)

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/telemetry/device.ts apps/api/src/auth/index.ts
git commit -m "feat(api): upsert device on Better Auth session create"
```

---

### Task 4: Queue middleware + consumer + Worker export

**Files:**
- Create: `apps/api/src/telemetry/request-log-middleware.ts`
- Create: `apps/api/src/telemetry/request-log-consumer.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/wrangler.jsonc`
- Regenerate: `apps/api/worker-configuration.d.ts`

- [ ] **Step 1: Create queue (Cloudflare account)**

```bash
pnpm --dir apps/api exec wrangler queues create llb-request-logs
```

Expected: queue created (or already exists).

- [ ] **Step 2: Update wrangler.jsonc**

Add at top-level (and mirror under `env.dev` if that env overrides bindings):

```jsonc
"queues": {
  "producers": [
    {
      "binding": "REQUEST_LOGS_QUEUE",
      "queue": "llb-request-logs"
    }
  ],
  "consumers": [
    {
      "queue": "llb-request-logs",
      "max_batch_size": 25,
      "max_batch_timeout": 5
    }
  ]
}
```

- [ ] **Step 3: Regenerate types**

```bash
pnpm --dir apps/api cf-typegen
```

Confirm `CloudflareBindings` includes `REQUEST_LOGS_QUEUE: Queue`.

- [ ] **Step 4: Middleware**

Create `apps/api/src/telemetry/request-log-middleware.ts`:

```ts
import type { MiddlewareHandler } from "hono";

import { extractClientMeta, redactPath } from "./client-meta.ts";
import { telemetryAls } from "./context.ts";
import type { RequestLogMessage } from "./types.ts";

type Env = { Bindings: CloudflareBindings };

export const requestLogMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const meta = extractClientMeta(c.req.raw);
  const store = { meta, userId: null as string | null, deviceId: null as string | null };

  await telemetryAls.run(store, async () => {
    const started = Date.now();
    await next();

    const url = new URL(c.req.url);
    const payload: RequestLogMessage = {
      ...store.meta,
      method: c.req.method,
      path: redactPath(`${url.pathname}${url.search}`),
      statusCode: c.res.status,
      latencyMs: Date.now() - started,
      userId: store.userId,
      deviceId: store.deviceId,
      createdAt: new Date().toISOString(),
    };

    try {
      await c.env.REQUEST_LOGS_QUEUE.send(payload);
    } catch (err) {
      console.error("request log enqueue failed", err);
    }
  });
};
```

- [ ] **Step 5: Consumer**

Create `apps/api/src/telemetry/request-log-consumer.ts`:

```ts
import { createDb } from "../db/index.ts";
import { requestLog } from "../db/schema.ts";
import type { RequestLogMessage } from "./types.ts";

function isRequestLogMessage(body: unknown): body is RequestLogMessage {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.method === "string" &&
    typeof b.path === "string" &&
    typeof b.statusCode === "number" &&
    typeof b.platform === "string"
  );
}

export async function handleRequestLogQueue(
  batch: MessageBatch<RequestLogMessage>,
  env: CloudflareBindings,
): Promise<void> {
  const db = createDb(env.HYPERDRIVE);
  const rows = [];

  for (const message of batch.messages) {
    if (!isRequestLogMessage(message.body)) {
      console.error("invalid request log message", message.id);
      message.ack();
      continue;
    }
    const m = message.body;
    rows.push({
      id: crypto.randomUUID(),
      createdAt: new Date(m.createdAt),
      requestId: m.requestId,
      platform: m.platform,
      method: m.method,
      path: m.path,
      statusCode: m.statusCode,
      latencyMs: m.latencyMs,
      userId: m.userId,
      deviceId: m.deviceId,
      ipAddress: m.ipAddress,
      userAgent: m.userAgent,
      browserName: m.browserName,
      browserVersion: m.browserVersion,
      osName: m.osName,
      osVersion: m.osVersion,
      deviceType: m.deviceType,
      country: m.country,
      city: m.city,
      appVersion: m.appVersion,
    });
  }

  if (rows.length === 0) return;

  try {
    await db.insert(requestLog).values(rows);
    for (const message of batch.messages) message.ack();
  } catch (err) {
    console.error("request_log insert failed", err);
    for (const message of batch.messages) message.retry();
  }
}
```

- [ ] **Step 6: Mount middleware in app.ts**

At the top of the Hono app (before routes), after creating `app`:

```ts
import { requestLogMiddleware } from "./telemetry/request-log-middleware.ts";

// ...
app.use("*", requestLogMiddleware);
```

Keep existing CORS + auth routes.

- [ ] **Step 7: Export fetch + queue**

Replace `apps/api/src/index.ts` with:

```ts
import app from "./app.ts";
import { handleRequestLogQueue } from "./telemetry/request-log-consumer.ts";
import type { RequestLogMessage } from "./telemetry/types.ts";

export default {
  fetch: app.fetch,
  queue: handleRequestLogQueue,
} satisfies ExportedHandler<CloudflareBindings, RequestLogMessage>;
```

- [ ] **Step 8: Typecheck**

```bash
pnpm --dir apps/api typecheck
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/telemetry/request-log-middleware.ts apps/api/src/telemetry/request-log-consumer.ts apps/api/src/app.ts apps/api/src/index.ts apps/api/wrangler.jsonc apps/api/worker-configuration.d.ts
git commit -m "feat(api): enqueue request logs and consume into Postgres"
```

---

### Task 5: Web client platform header

**Files:**
- Modify: `apps/web/src/lib/auth.ts`

- [ ] **Step 1: Attach header on all Better Auth fetches**

Update `apps/web/src/lib/auth.ts`:

```ts
import { createAuthClient } from "better-auth/react";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8787";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    headers: {
      "X-Client-Platform": "web",
    },
  },
});
```

If the installed Better Auth version uses a different option name, check types / docs and use the supported `fetchOptions` / `$fetch` headers API — goal is every auth client request includes `X-Client-Platform: web`.

- [ ] **Step 2: Web lint**

```bash
pnpm --dir apps/web lint
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/auth.ts
git commit -m "feat(web): send X-Client-Platform web on auth client requests"
```

---

### Task 6: Manual verification checklist

**Files:** none (manual)

- [ ] **Step 1: Run API locally with queues**

```bash
pnpm --dir apps/api migrate   # if not already applied
pnpm dev:api
```

- [ ] **Step 2: Hit health**

```bash
curl -s -D- -o /dev/null -H 'X-Client-Platform: web' http://localhost:8787/health
```

- [ ] **Step 3: Confirm queue drain + Postgres**

In local Postgres (Hyperdrive local connection from wrangler):

```sql
SELECT platform, method, path, status_code, latency_ms, browser_name
FROM request_log
ORDER BY created_at DESC
LIMIT 5;
```

Expected: at least one row for `/health` with `platform = web` (or `unknown` if header omitted on a control request).

- [ ] **Step 4: Sign up / sign in from web**

Use the web app login/register, then:

```sql
SELECT id, user_id, platform, browser_name, os_name, fingerprint, last_seen_at
FROM device
ORDER BY created_at DESC
LIMIT 5;
```

Expected: a device row for the user with `platform = web`.

- [ ] **Step 5: Final commit if verification fixed anything**

Only if code changed during verification:

```bash
git add -A
git commit -m "fix(api): telemetry verification follow-ups"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Explicit platform header | Tasks 1, 5 |
| Separate `device` table + upsert on session | Tasks 2, 3 |
| Every request → Queue → Postgres | Task 4 |
| Rich meta (UA parse, CF geo, latency, request id) | Tasks 1, 4 |
| Don’t break requests on telemetry failure | Tasks 3, 4 |
| Keep forever / pruning later | `docs/to-do-later.md` (already written) |
| Web sends platform | Task 5 |
| Worker fetch + queue export | Task 4 |

## Notes for implementers

- `nodejs_compat` is already enabled — required for `AsyncLocalStorage` and `pg`.
- Local Queues work with `wrangler dev`; if consumer does not run in some local setups, use `wrangler dev` docs / `--test-scheduled` equivalents — verify against current Wrangler 4 queue local behavior.
- Do not log bodies or cookie/authorization header values.
- Mobile app is out of repo; document header contract in PR description for future mobile work.
