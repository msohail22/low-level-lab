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
