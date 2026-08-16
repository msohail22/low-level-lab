import { Hono } from "hono";

import { health } from "./health.ts";
import { questionsRoutes, reviewRoutes } from "./questions.ts";

export const routes = new Hono();

routes.route("/health", health);
routes.route("/api/questions", questionsRoutes);
routes.route("/api/review", reviewRoutes);
