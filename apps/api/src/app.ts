import { Hono } from "hono";
import { routes } from "./routes/index.ts";
import { auth } from "./auth/index.ts";

const app = new Hono();

app.on(
  [
    "GET",
    "POST"
  ], "/api/auth/*", (c) => {
    return auth.handler(c.req.raw);
  }
);

app.route("/", routes);

export default app;
