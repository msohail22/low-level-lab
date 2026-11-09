import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";
import { loadPrefs } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";

/**
 * The reader's own page: who they are signed in as, their settings, and the
 * two account actions. One page rather than a profile that links to a settings
 * page, because the profile held nothing else.
 *
 * Layout: each setting is one row — label and hint on the left, the control on
 * the right — inside a bordered card, the shape a settings list has everywhere.
 * Reading down the left edge then lists what can be changed, with no stack of
 * headings to scroll past. The rows stack on a phone, where there is no room
 * for two columns.
 */
export default async function MePage() {
  syncWorkosEnv();
  const { user } = await withAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to save which questions you have solved, and to keep your
          settings across browsers.
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

  const prefs = await loadPrefs(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.firstName ?? user.email}
        </h1>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </header>

      {/*
       * The controls are a client component: a press saves on its own, with
       * the change applied before the server answers. The values it starts
       * with are rendered here on the server, so the page is correct before
       * any JavaScript runs.
       */}
      <div className="mt-8">
        <SettingsForm initialPrefs={prefs} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium">Account</h2>

        <div className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          <div className="p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
            {/* The button says "Sign out"; the row must not say it twice. */}
            <p className="text-sm">
              Session
              <span className="mt-0.5 block text-sm text-muted">
                Signed in on this browser.
              </span>
            </p>
            {/* A link, not a form: /signout is a GET route that clears the cookie. */}
            <a
              href="/signout"
              className="mt-3 inline-block rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:border-accent sm:mt-0 sm:shrink-0"
            >
              Sign out
            </a>
          </div>

          <div className="p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <p className="text-sm">
              Your data
              <span className="mt-0.5 block text-sm text-muted">
                Removes your settings and solved marks. Your account lives with
                the sign-in provider and is not touched.
              </span>
            </p>
            <form method="post" action="/me/forget" className="mt-3 sm:mt-0 sm:shrink-0">
              <button
                type="submit"
                className="cursor-pointer rounded-md border border-hard px-3 py-1.5 text-sm font-medium whitespace-nowrap text-hard"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
