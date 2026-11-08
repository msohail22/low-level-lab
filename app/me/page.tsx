import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";

export default async function MePage() {
  syncWorkosEnv();
  const { user } = await withAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to save which questions you have solved.
        </p>
        {/* A link, not a form: the PKCE cookie is written by the route. */}
        <a
          href="/signin"
          className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg"
        >
          Continue
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        {user.firstName ?? user.email}
      </h1>
      <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>
      <a href="/signout" className="mt-6 inline-block text-sm text-muted hover:text-accent">
        Sign out
      </a>
    </div>
  );
}
