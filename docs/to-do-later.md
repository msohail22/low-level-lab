# To-do later

Deferred work that is intentionally out of scope for the current client-telemetry / request-logging design. Come back to these when the feature is stable in production.

## Learning platform phases 2–4 (shipped v1)

Implemented in migration `0005_engagement_pedagogy_trust` + `/api/learn` platform routes:

**Phase 2:** daily challenge + day board, achievements, moderated comments, follow authors / curated sets  
**Phase 3:** progressive hints, adaptive next question, glossary; sandbox is output-check for `print_output` (full compiler stubbed)  
**Phase 4:** report question → reviewer queue, question version snapshots, author reputation  

Still later: external code runner, richer version UI/diff, Redis cache, realtime DO leaderboard, GraphQL, OpenFGA prod, request-log pruning.

## Request log pruning

**Why:** v1 keeps every API request log in Postgres forever. Volume will grow; pruning will be needed before storage/cost becomes painful.

**Suggested approach:**
- Cloudflare Cron Trigger (or scheduled Worker) on a daily/hourly cadence
- Batch-delete old rows to avoid long locks, e.g.:

```sql
DELETE FROM request_log
WHERE id IN (
  SELECT id FROM request_log
  WHERE created_at < now() - interval '90 days'
  ORDER BY created_at
  LIMIT 5000
);
```

- Repeat until zero rows deleted
- Index on `created_at` (already planned for `request_log`) so deletes stay cheap
- Make retention days env-configurable (default e.g. 90)

**Also decide later:**
- Whether device rows are pruned separately (e.g. inactive / no linked session)
- Whether to archive to R2 before delete vs hard-delete only
- Alerts when `request_log` row count or table size crosses a threshold

## GraphQL API (leaderboard + telemetry + questions)

Expose **leaderboard**, **telemetry**, and eventually **questions / topics** through a **GraphQL API** instead of (or in addition to) ad-hoc REST routes.

**Scope to cover later:**
- GraphQL schema + resolvers for leaderboard queries/mutations
- GraphQL schema + resolvers for telemetry: devices, request logs, platform/usage aggregates
- GraphQL for community questions (list approved, contribute mutations) once REST stabilizes
- Auth / authorization on GraphQL (session-aware; OpenFGA checks)
- Wire into `apps/api` (e.g. Yoga / GraphQL Yoga on Hono, or similar Workers-friendly stack)
- Web (and future mobile) clients query GraphQL for leaderboard + telemetry views

## Realtime leaderboard Durable Object

**Idea:** After each attempt write to Postgres, notify a **Leaderboard Durable Object** that keeps top-N rankings in DO state and pushes updates over WebSockets for live leaderboard UIs.

**Scope to cover later:**
- `LeaderboardDO` with hibernated WebSockets
- Rebuild ranking from Postgres on DO alarm / first request
- Attempt API hooks into DO after successful insert
- Optional GraphQL subscription or keep WS separate from GraphQL

## Redis cache for question lists

**Why:** Learner/topic question list endpoints hit Postgres on every request. As approved content grows, repeated “full list” (or topic-scoped list) reads should be served from **Redis** so the API stays fast without hammering the DB.

**Idea:**
- Keep the **canonical question data in Postgres** (create / approve / reject / edit still write there).
- Cache the **read query results** in Redis — e.g. full approved questions list, and/or per-topic approved lists (whatever the hot paths are).
- On any mutation that changes what learners see (question **created**, **submitted**, **approved**, **rejected**, **updated**, **deleted**): **invalidate (flush/delete) the relevant Redis keys** so the next read rebuilds from Postgres and re-populates the cache.
- Prefer “invalidate then lazy re-fill on next GET” over complex write-through for v1.

**Suggested approach:**
- Bind Redis via Cloudflare (e.g. **Upstash Redis** HTTP / Workers Redis binding) or a managed Redis reachable from the Worker.
- Key examples (tune as needed):
  - `questions:approved:all` — full approved list payload used by browse/practice index
  - `questions:approved:topic:{topicId}` — per-topic approved list
  - Optional: `questions:approved:filters:{hash}` only if filter combinations are worth caching; otherwise cache the base list and filter in-process
- TTL as a safety net (e.g. 5–15 minutes) even with explicit invalidation.
- After invalidate, first request after a write pays one Postgres round-trip; subsequent reads hit Redis.

**Invalidate on these events (at minimum):**
- Create / update question
- Submit for review (status → pending)
- Approve / reject
- Any admin edit that changes type, difficulty, topic, prompt, or options for an approved question

**Out of scope for this item:** caching individual attempt grading payloads or user-specific “attempted” flags inside the same Redis blob (those stay user-scoped; either merge at read time from Postgres/attempts, or use separate per-user keys later).

## OpenFGA production setup

REST + local reviewer/admin fallback (`REVIEWER_USER_IDS` / `ADMIN_USER_IDS`) ships first. Later:
- Stand up OpenFGA store and write `apps/api/openfga/model.fga`
- Set `OPENFGA_API_URL`, `OPENFGA_STORE_ID`, `OPENFGA_MODEL_ID`, `OPENFGA_API_TOKEN`
- Admin UI grant/revoke `reviewer` / `admin` on `platform:llb` (partially started)
- On signup hook: always write `member` tuple (partially done on question create)

## Related follow-ups (optional)

- Dashboard / admin UI to browse devices and request logs (prefer GraphQL above)
- Sampling high-traffic paths if volume is huge (log 100% of mutations, N% of GETs)
- PII review: IP + geo retention policy, export/delete for account deletion
- Dead-letter queue for request-log messages that fail consumer inserts repeatedly
- Refresh `device.lastSeenAt` on authenticated API traffic (v1 only upserts on session create)
- Reconcile Drizzle meta snapshots: `0000` still describes old `users` table while live schema is Better Auth (`user`/`session`/…). `drizzle-kit generate` prompts interactively; prefer `db:push` or hand-written SQL until snapshots are aligned


