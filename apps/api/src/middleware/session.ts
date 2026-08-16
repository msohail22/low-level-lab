import type { MiddlewareHandler } from "hono";

import { createAuth } from "../auth/index.ts";

export type AppVariables = {
  userId: string;
  userEmail: string;
  userName: string;
};

type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: AppVariables;
};

export const requireSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", session.user.id);
  c.set("userEmail", session.user.email);
  c.set("userName", session.user.name);
  await next();
};
