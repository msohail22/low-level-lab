import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";
import { PREFS_COOKIE, forgetUser } from "@/lib/settings";

/** Deletes every row this site holds for the signed-in reader. */
export async function POST() {
  syncWorkosEnv();
  const { user } = await withAuth();
  if (!user) return new Response("Sign in first", { status: 401 });

  await forgetUser(user.id);

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/me",
      // The cache has to go with the rows, or the old theme would survive.
      "Set-Cookie": `${PREFS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
    },
  });
}
