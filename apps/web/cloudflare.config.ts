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
      /**
       * A read cache in front of DB for a reader's settings. D1 stays the
       * source of truth; KV only saves the round trip on a page that has to
       * read settings. Every write updates it, so a stale entry needs the
       * write itself to fail — and a miss is only a slower correct answer.
       */
      PREFS: bindings.kv({ id: "9811c8698389480eb8ded2549766818a" }),
    },
  }),
});
