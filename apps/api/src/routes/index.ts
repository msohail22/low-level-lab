import { Hono } from "hono";

import { health } from "./health.ts";
import { engagementRoutes } from "./engagement.ts";
import { learnRoutes, leaderboardRoutes } from "./learn.ts";
import {
  adminRoutes,
  meRoutes,
  questionsRoutes,
  reviewRoutes,
} from "./questions.ts";

export const routes = new Hono();

routes.route("/health", health);
routes.route("/api/me", meRoutes);
routes.route("/api/questions", questionsRoutes);
routes.route("/api/review", reviewRoutes);
routes.route("/api/admin", adminRoutes);
routes.route("/api/learn", learnRoutes);
routes.route("/api/learn", engagementRoutes);
routes.route("/api/leaderboard", leaderboardRoutes);
