import { Hono } from "hono";
import { cors } from "hono/cors";

import { createAuth } from "./auth/index.ts";
import { getTrustedOrigins } from "./auth/config.ts";
import { routes } from "./routes/index.ts";
import { requestLogMiddleware } from "./telemetry/request-log-middleware.ts";

type AppEnv = {
  Bindings: CloudflareBindings;
};

const app = new Hono<AppEnv>();

app.use("*", requestLogMiddleware);

app.use("/api/auth/*", async (c, next) => {
  const origins = getTrustedOrigins(c.env);

  const corsMiddleware = cors({
    origin: (origin) => (origins.includes(origin) ? origin : origins[0]),
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Client-Platform",
      "X-App-Version",
    ],
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  });

  return corsMiddleware(c, next);
});

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return createAuth(c.env).handler(c.req.raw);
});

app.route("/", routes);

export default app;
