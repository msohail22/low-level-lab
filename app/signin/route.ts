import { redirect } from "next/navigation";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";

/**
 * Starts the sign-in flow.
 *
 * This is a route handler, not a page, because getSignInUrl() stores a PKCE
 * verifier in a cookie — and a page render may not set cookies. Linking to
 * this route from a page is what keeps the cookie write in a context that
 * allows it.
 */
export async function GET() {
  syncWorkosEnv();
  redirect(await getSignInUrl());
}
