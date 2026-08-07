import { Hono } from "hono";

export function createApp() {
  const app = new Hono();

  return app;
}
