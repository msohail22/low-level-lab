import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { createDb } from "../db/index.ts";
import * as schema from "../db/schema.ts";
import { getTrustedOrigins } from "./config.ts";
import { upsertDeviceForSession } from "../telemetry/device.ts";

export function createAuth(env: CloudflareBindings) {
  const db = createDb(env.HYPERDRIVE);

  return betterAuth({
    appName: "Low-Level Lab",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: getTrustedOrigins(env),
    emailAndPassword: {
      enabled: true,
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            await upsertDeviceForSession({
              hyperdrive: env.HYPERDRIVE,
              userId: session.userId,
              sessionId: session.id,
            });
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
