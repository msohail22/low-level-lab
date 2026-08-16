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
  const accepted: {
    message: Message<RequestLogMessage>;
    row: typeof requestLog.$inferInsert;
  }[] = [];

  for (const message of batch.messages) {
    if (!isRequestLogMessage(message.body)) {
      console.error("invalid request log message", message.id);
      message.ack();
      continue;
    }
    const m = message.body;
    accepted.push({
      message,
      row: {
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
      },
    });
  }

  if (accepted.length === 0) return;

  try {
    await db.insert(requestLog).values(accepted.map((item) => item.row));
    for (const item of accepted) item.message.ack();
  } catch (err) {
    console.error("request_log insert failed", err);
    for (const item of accepted) item.message.retry();
  }
}

/**
 * Dead-Letter Queue (DLQ) Consumer Handler
 * Captures failed telemetry items after max retries and backs them up to R2/Console
 */
export async function handleRequestLogDlqQueue(
  batch: MessageBatch<RequestLogMessage>,
  env: CloudflareBindings,
): Promise<void> {
  console.warn(
    `[DLQ Consumer] Processing ${batch.messages.length} dead-letter queue messages`,
  );

  const jsonl = batch.messages
    .map((m) => JSON.stringify({ id: m.id, timestamp: m.timestamp, body: m.body }))
    .join("\n");

  if (env.R2_TELEMETRY_BUCKET) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const dateStr = new Date().toISOString().slice(0, 10);
      const [year, month, day] = dateStr.split("-");
      const key = `dlq/year=${year}/month=${month}/day=${day}/dlq_batch_${timestamp}.jsonl`;

      await env.R2_TELEMETRY_BUCKET.put(key, jsonl, {
        httpMetadata: { contentType: "application/x-ndjson" },
        customMetadata: { batchSize: String(batch.messages.length) },
      });
      console.log(`[DLQ Consumer] Archived DLQ batch to R2: ${key}`);
    } catch (err) {
      console.error("[DLQ Consumer] R2 backup failed:", err);
    }
  }

  for (const message of batch.messages) {
    message.ack();
  }
}
