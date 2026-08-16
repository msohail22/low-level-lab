import { sql } from "drizzle-orm";
import { createDb } from "../db/index.ts";

export async function pruneRequestLogs(
  env: CloudflareBindings,
  retentionDaysOverride?: number,
): Promise<{ deletedCount: number }> {
  try {
    const retentionDays =
      retentionDaysOverride ??
      (Number(env.REQUEST_LOG_RETENTION_DAYS || "90") || 90);

    const db = createDb(env.HYPERDRIVE);
    let totalDeleted = 0;
    let batchDeleted = 0;
    const batchSize = 5000;

    // Loop in batches to prevent long locks on the DB table
    do {
      const result = await db.execute(sql`
        DELETE FROM request_log
        WHERE id IN (
          SELECT id FROM request_log
          WHERE created_at < NOW() - (${retentionDays} || ' days')::INTERVAL
          ORDER BY created_at ASC
          LIMIT ${batchSize}
        )
      `);

      // Result count checking
      batchDeleted = Number(result.rowCount ?? 0);
      totalDeleted += batchDeleted;
    } while (batchDeleted >= batchSize);

    if (totalDeleted > 0) {
      console.log(
        `[RequestLogPruner] Pruned ${totalDeleted} request log entries older than ${retentionDays} days`,
      );
    }

    return { deletedCount: totalDeleted };
  } catch (err) {
    console.error("[RequestLogPruner] Error pruning request logs:", err);
    return { deletedCount: 0 };
  }
}
