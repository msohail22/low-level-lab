import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";

/**
 * The header's sign-in state.
 *
 * Only reads — never calls getSignInUrl(), which writes a PKCE cookie and so
 * belongs in the /signin route handler. The proxy covers every page, so any
 * session refresh has already happened before this renders.
 */
export async function AuthNav() {
  syncWorkosEnv();

  let user = null;
  try {
    ({ user } = await withAuth());
  } catch {
    // A page must still render if the session cannot be read.
    user = null;
  }

  if (!user) {
    return (
      <a href="/signin" className="hover:text-accent">
        Sign in
      </a>
    );
  }

  return (
    <Link href="/me" className="text-text hover:text-accent">
      {user.firstName ?? user.email}
    </Link>
  );
}
