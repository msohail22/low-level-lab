import { Hono } from "hono";

import { health } from "./health.ts";
import { engagementRoutes } from "./engagement.ts";
import { learnRoutes, leaderboardRoutes } from "./learn.ts";
import { platformRoutes } from "./platform.ts";
import { reactorRoutes } from "./reactor.ts";
import { studyRoutes } from "./study.ts";
import {
  adminRoutes,
  meRoutes,
  questionsRoutes,
  reviewRoutes,
} from "./questions.ts";

import { graphqlRoutes } from "../graphql/index.ts";

export const routes = new Hono<{ Bindings: CloudflareBindings }>();

routes.route("/health", health);
routes.route("/api/me", meRoutes);
routes.route("/api/questions", questionsRoutes);
routes.route("/api/review", reviewRoutes);
routes.route("/api/admin", adminRoutes);
routes.route("/api/learn", learnRoutes);
routes.route("/api/learn", engagementRoutes);
routes.route("/api/learn", platformRoutes);
routes.route("/api/learn", studyRoutes);
routes.route("/api/leaderboard", leaderboardRoutes);

routes.get("/api/leaderboard/ws", (c) => {
  if (!c.env.LEADERBOARD_DO) {
    return c.text("Leaderboard Durable Object not configured", 503);
  }
  const id = c.env.LEADERBOARD_DO.idFromName("global-leaderboard");
  const stub = c.env.LEADERBOARD_DO.get(id);
  return stub.fetch(c.req.raw);
});

routes.route("/api/graphql", graphqlRoutes);
routes.route("/api/reactor", reactorRoutes);

