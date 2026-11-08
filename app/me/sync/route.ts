import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";
import {
  PREFS_COOKIE,
  PREFS_COOKIE_MAX_AGE,
  encodePrefs,
  loadPrefs,
} from "@/lib/settings";

/**
 * Copies the stored settings into this browser's cookie, then goes to the
 * profile. /callback sends the reader here right after sign-in, which is what
 * makes a saved theme follow them to a new browser: every page then reads the
 * cookie and no page reads the database to draw itself.
 */
export async function GET() {
  syncWorkosEnv();
  const { user } = await withAuth();
  if (!user) return new Response(null, { status: 303, headers: { Location: "/signin" } });

  const prefs = await loadPrefs(user.id);

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/me",
      "Set-Cookie": `${PREFS_COOKIE}=${encodePrefs(prefs)}; Path=/; Max-Age=${PREFS_COOKIE_MAX_AGE}; SameSite=Lax`,
    },
  });
}
