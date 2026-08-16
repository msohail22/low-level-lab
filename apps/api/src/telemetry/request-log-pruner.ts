import { sql } from "drizzle-orm";
import { createDb } from "../db/index.ts";

export async function pruneRequestLogs(
  env: CloudflareBindings,
  retentionDaysOverride?: number,
): Promise<{ archivedCount: number; deletedCount: number }> {
  try {
    const retentionDays =
      retentionDaysOverride ??
      (Number(env.REQUEST_LOG_RETENTION_DAYS || "90") || 90);

    const db = createDb(env.HYPERDRIVE);
    let totalDeleted = 0;
    let totalArchived = 0;
    let batchDeleted = 0;
    const batchSize = 5000;

    // Loop in batches to prevent long locks on the DB table
    do {
      // 1. Fetch batch to archive
      const oldRowsResult = await db.execute(sql`
        SELECT * FROM request_log
        WHERE created_at < NOW() - (${retentionDays} || ' days')::INTERVAL
        ORDER BY created_at ASC
        LIMIT ${batchSize}
      `);

      const rows = oldRowsResult.rows || [];
      if (rows.length === 0) break;

      // 2. Archive to R2 Bucket if binding exists
      if (env.R2_TELEMETRY_BUCKET) {
        const jsonl = rows.map((r) => JSON.stringify(r)).join("\n");
        const timestamp = Math.floor(Date.now() / 1000);
        const dateStr = new Date().toISOString().slice(0, 10);
        const [year, month, day] = dateStr.split("-");
        const r2Key = `request_logs/year=${year}/month=${month}/day=${day}/batch_${timestamp}_count_${rows.length}.jsonl`;

        try {
          await env.R2_TELEMETRY_BUCKET.put(r2Key, jsonl, {
            httpMetadata: { contentType: "application/x-ndjson" },
            customMetadata: {
              rowCount: String(rows.length),
              retentionDays: String(retentionDays),
            },
          });
          totalArchived += rows.length;
          console.log(
            `[RequestLogPruner] R2 Archival stored ${rows.length} entries to ${r2Key}`,
          );
        } catch (r2Err) {
          console.error("[RequestLogPruner] Failed uploading batch to R2:", r2Err);
          // If R2 upload failed, proceed to abort batch delete to preserve telemetry
          break;
        }
      }

      // 3. Delete archived batch from Postgres
      const ids = rows.map((r: Record<string, unknown>) => String(r.id));
      const deleteResult = await db.execute(sql`
        DELETE FROM request_log
        WHERE id = ANY(${ids})
      `);

      batchDeleted = Number(deleteResult.rowCount ?? rows.length);
      totalDeleted += batchDeleted;
    } while (batchDeleted >= batchSize);

    if (totalDeleted > 0) {
      console.log(
        `[RequestLogPruner] Pruned ${totalDeleted} request log entries older than ${retentionDays} days (${totalArchived} archived to R2)`,
      );
    }

    return { archivedCount: totalArchived, deletedCount: totalDeleted };
  } catch (err) {
    console.error("[RequestLogPruner] Error pruning request logs:", err);
    return { archivedCount: 0, deletedCount: 0 };
  }
}
