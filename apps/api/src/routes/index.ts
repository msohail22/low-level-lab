import { Hono } from "hono";
import { health } from "./health.ts";

export const routes = new Hono();

routes.route("/health", health);
