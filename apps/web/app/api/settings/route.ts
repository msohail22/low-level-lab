import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";
import {
  PREFS_COOKIE,
  PREFS_COOKIE_MAX_AGE,
  encodePrefs,
  loadPrefs,
  savePrefs,
  type Prefs,
} from "@/lib/settings";

/**
 * The settings API the browser talks to.
 *
 * GET returns the stored settings; PATCH takes a partial object and returns
 * what landed. Both answer with the full set, never a confirmation, so the
 * client can replace its state with the response and never has to guess what
 * the server decided.
 *
 * Every answer also rewrites the preferences cookie, because the server
 * renders the theme from that cookie. Without it the page would be correct
 * until the next full load and then snap back.
 */

function json(prefs: Prefs, status = 200) {
  return new Response(JSON.stringify(prefs), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${PREFS_COOKIE}=${encodePrefs(prefs)}; Path=/; Max-Age=${PREFS_COOKIE_MAX_AGE}; SameSite=Lax`,
      // A reader's own settings: never a shared cache's business.
      "Cache-Control": "private, no-store",
    },
  });
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "not signed in" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  syncWorkosEnv();
  const { user } = await withAuth();
  if (!user) return unauthorized();

  return json(await loadPrefs(user.id));
}

export async function PATCH(request: Request) {
  syncWorkosEnv();
  const { user } = await withAuth();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "body is not JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return new Response(JSON.stringify({ error: "body must be an object" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // savePrefs drops any key or value the registry does not declare, so an
  // unknown field is ignored rather than rejected — a client built against an
  // older deploy still saves the settings this one still has.
  return json(await savePrefs(user.id, body as Record<string, string>));
}
