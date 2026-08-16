import type { MiddlewareHandler } from "hono";

import { extractClientMeta, redactPath } from "./client-meta.ts";
import { telemetryAls } from "./context.ts";
import type { RequestLogMessage } from "./types.ts";

type Env = { Bindings: CloudflareBindings };

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
