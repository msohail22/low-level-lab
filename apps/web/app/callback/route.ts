import { handleAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";

// WorkOS redirects back here after sign-in. This route runs outside the proxy,
// so it bridges the environment itself.
export async function GET(request: Request) {
  syncWorkosEnv();
  return handleAuth({ returnPathname: "/me/sync" })(request as never);
}
