import app from "./app.ts";
import { handleRequestLogQueue } from "./telemetry/request-log-consumer.ts";
import type { RequestLogMessage } from "./telemetry/types.ts";

export default {
  fetch: app.fetch,
  queue: handleRequestLogQueue,
} satisfies ExportedHandler<CloudflareBindings, RequestLogMessage>;
