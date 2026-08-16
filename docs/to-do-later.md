# To-do later

Deferred work that is intentionally out of scope for the current client-telemetry / request-logging design. Come back to these when the feature is stable in production.

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

## OpenFGA production setup

REST + local reviewer fallback (`REVIEWER_USER_IDS`) ships first. Later:
- Stand up OpenFGA store and write `apps/api/openfga/model.fga`
- Set `OPENFGA_API_URL`, `OPENFGA_STORE_ID`, `OPENFGA_MODEL_ID`, `OPENFGA_API_TOKEN`
- Admin UI or script to grant `reviewer` / `admin` on `platform:llb`
- On signup hook: always write `member` tuple (partially done on question create)

## Related follow-ups (optional)

- Dashboard / admin UI to browse devices and request logs (prefer GraphQL above)
- Sampling high-traffic paths if volume is huge (log 100% of mutations, N% of GETs)
- PII review: IP + geo retention policy, export/delete for account deletion
- Dead-letter queue for request-log messages that fail consumer inserts repeatedly
- Refresh `device.lastSeenAt` on authenticated API traffic (v1 only upserts on session create)
- Reconcile Drizzle meta snapshots: `0000` still describes old `users` table while live schema is Better Auth (`user`/`session`/…). `drizzle-kit generate` prompts interactively; prefer `db:push` or hand-written SQL until snapshots are aligned


