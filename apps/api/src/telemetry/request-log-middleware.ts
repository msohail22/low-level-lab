import type { MiddlewareHandler } from "hono";

import { extractClientMeta, redactPath } from "./client-meta.ts";
import { telemetryAls } from "./context.ts";
import type { RequestLogMessage } from "./types.ts";

type Env = { Bindings: CloudflareBindings };

function shouldSampleRequest(
  method: string,
  statusCode: number,
  sampleRate = 0.10,
): boolean {
  // Always log non-GET state mutations (POST, PUT, PATCH, DELETE) and error statuses
  if (method !== "GET" || statusCode >= 400) {
    return true;
  }
  // Rate-sample read-only GET requests
  return Math.random() < sampleRate;
}

export const requestLogMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const meta = extractClientMeta(c.req.raw);
  const store = {
    meta,
    userId: null as string | null,
    deviceId: null as string | null,
  };

  await telemetryAls.run(store, async () => {
    const started = Date.now();
    await next();

    const sampleRate = Number(c.env.REQUEST_LOG_SAMPLE_RATE || "0.10") || 0.10;
    if (!shouldSampleRequest(c.req.method, c.res.status, sampleRate)) {
      return;
    }

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
      if (c.env.REQUEST_LOGS_QUEUE) {
        await c.env.REQUEST_LOGS_QUEUE.send(payload);
      }
    } catch (err) {
      console.error("request log enqueue failed", err);
    }
  });
};
