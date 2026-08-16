import app from "./app.ts";
import { handleRequestLogQueue } from "./telemetry/request-log-consumer.ts";
import { pruneRequestLogs } from "./telemetry/request-log-pruner.ts";
import type { RequestLogMessage } from "./telemetry/types.ts";

export { LeaderboardDO } from "./durable-objects/LeaderboardDO.ts";

export default {
  fetch: app.fetch,
  queue: handleRequestLogQueue,
  scheduled: async (_event, env, ctx) => {
    ctx.waitUntil(pruneRequestLogs(env));
  },
} satisfies ExportedHandler<CloudflareBindings, RequestLogMessage>;

