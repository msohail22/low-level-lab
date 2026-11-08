import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";
import {
  PREFS_COOKIE,
  PREFS_COOKIE_MAX_AGE,
  SETTINGS,
  encodePrefs,
  isValid,
  loadPrefs,
  savePref,
} from "@/lib/settings";

/**
 * Saves the settings form.
 *
 * A route handler rather than a page, because it writes the preferences
 * cookie that every page reads to apply the theme.
 */
export async function POST(request: Request) {
  syncWorkosEnv();
  const { user } = await withAuth();
  if (!user) return new Response("Sign in first", { status: 401 });

  const form = await request.formData();

  for (const setting of SETTINGS) {
    const value = form.get(setting.key);
    // Only values the registry declares reach the database.
    if (typeof value === "string" && isValid(setting.key, value)) {
      await savePref(user.id, setting.key, value);
    }
  }

  // Read back rather than trust the form, so the cookie can never hold a
  // value the database does not.
  const prefs = await loadPrefs(user.id);

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/me",
      "Set-Cookie": `${PREFS_COOKIE}=${encodePrefs(prefs)}; Path=/; Max-Age=${PREFS_COOKIE_MAX_AGE}; SameSite=Lax`,
    },
  });
}
