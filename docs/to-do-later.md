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

## Related follow-ups (optional)

- Dashboard / admin UI to browse devices and request logs
- Sampling high-traffic paths if volume is huge (log 100% of mutations, N% of GETs)
- PII review: IP + geo retention policy, export/delete for account deletion
- Dead-letter queue for request-log messages that fail consumer inserts repeatedly
- Refresh `device.lastSeenAt` on authenticated API traffic (v1 only upserts on session create)
- Create Cloudflare Queue `llb-request-logs` in the account (`wrangler queues create llb-request-logs`) if not already created before deploy
- Reconcile Drizzle meta snapshots: `0000` still describes old `users` table while live schema is Better Auth (`user`/`session`/…). `drizzle-kit generate` prompts interactively; prefer `db:push` or hand-written SQL until snapshots are aligned


