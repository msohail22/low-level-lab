import { Hono } from "hono";
import { cors } from "hono/cors";

import { corsOptions } from "./config/cors";
import { requestLogger } from "./middleware/logger";


const app = new Hono<{ Bindings: CloudflareBindings }>();
app.use("*", requestLogger);
app.use("*", cors(corsOptions));


export default app;
