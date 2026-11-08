import type { NextMiddleware } from "next/server";
import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";

/**
 * authkit needs its secrets in process.env, which does not exist on workerd,
 * so they are bridged from the Worker binding before the handler is built.
 * The handler is created lazily for the same reason: building it at module
 * scope would run before the bridge.
 */
let handler: NextMiddleware | undefined;

const proxy: NextMiddleware = (request, event) => {
  syncWorkosEnv();
  handler ??= authkitProxy();
  return handler(request, event);
};

export default proxy;

export const config = {
  /*
   * Every page, so the header can show who is signed in.
   *
   * It also fixes a latent bug: refreshing an expired session writes a cookie,
   * which a page render may not do. The proxy runs first and refreshes there,
   * where writing is allowed, so the page only ever reads.
   *
   * Static assets and the generated test-case chunks are excluded — they are
   * served from the asset store and never need a session.
   */
  matcher: ["/((?!_next/static|_next/image|tests/|favicon.ico).*)"],
};
