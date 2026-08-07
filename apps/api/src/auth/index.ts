import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { createDb } from "../db/index.ts";
import { authConfig } from "./config.ts";

export const auth = betterAuth({
  database: drizzleAdapter(createDb, {
    provider: "pg"
  }),

  ...authConfig,

  emailAndPassword: {
    enabled: true,
  }
});


