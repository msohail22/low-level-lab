import { Hono } from "hono";
import { routes } from "./routes/index.ts";

const app = new Hono();

app.route("/", routes);

export default app;
