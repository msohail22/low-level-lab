import { Hono } from "hono";
import { graphql } from "graphql";

import { createAuth } from "../auth/index.ts";
import { schema } from "./schema.ts";
import { rootResolver } from "./resolvers.ts";

type AppEnv = {
  Bindings: CloudflareBindings;
};

export const graphqlRoutes = new Hono<AppEnv>();

graphqlRoutes.post("/", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;

  const body = (await c.req.json().catch(() => null)) as {
    query?: string;
    variables?: Record<string, unknown>;
    operationName?: string;
  } | null;

  if (!body || !body.query) {
    return c.json({ errors: [{ message: "Missing GraphQL query" }] }, 400);
  }

  const result = await graphql({
    schema,
    source: body.query,
    rootValue: rootResolver,
    contextValue: {
      env: c.env,
      userId,
      userEmail,
      userName,
    },
    variableValues: body.variables,
    operationName: body.operationName,
  });

  return c.json(result);
});

graphqlRoutes.get("/", (c) => {
  return c.text("GraphQL API endpoint. Send POST requests with JSON payload { query, variables }.");
});
