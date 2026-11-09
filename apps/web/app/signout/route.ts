import { signOut } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";

/**
 * Ends the session. A route handler, not a page: signing out clears the
 * session cookie, and a page render may not write cookies.
 */
export async function GET() {
  syncWorkosEnv();
  return signOut({ returnTo: "/" });
}
