import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "low-level-lab",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-06",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      // WorkOS. The client id is not sensitive; the other two are.
      // In dev these come from .dev.vars; in production from Worker secrets.
      WORKOS_CLIENT_ID: bindings.secret(),
      WORKOS_API_KEY: bindings.secret(),
      WORKOS_COOKIE_PASSWORD: bindings.secret(),
      // Progress and settings. Identity lives in WorkOS, not here.
      DB: bindings.d1({ name: "low-level-lab" }),
    },
  }),
});
