import { withAuth } from "@workos-inc/authkit-nextjs";
import { syncWorkosEnv } from "@/lib/workos-env";
import { SETTINGS, loadPrefs } from "@/lib/settings";

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
       * A plain form posting to a route handler. Saving writes a cookie, and a
       * page render may not write cookies — the same reason /signin and
       * /signout are routes. It also means settings work with no JavaScript.
       */}
      <form method="post" action="/me/save" className="mt-8">
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {SETTINGS.map((setting) => (
            <fieldset
              key={setting.key}
              className="border-0 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="sm:min-w-0">
                <legend className="text-sm font-medium">{setting.label}</legend>
                <p className="mt-0.5 text-sm text-muted">{setting.hint}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
                {setting.options.map((option) => (
                  <label
                    key={option.value}
                    className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm whitespace-nowrap has-checked:border-accent has-checked:font-medium has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-accent"
                  >
                    <input
                      type="radio"
                      name={setting.key}
                      value={option.value}
                      defaultChecked={prefs[setting.key] === option.value}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {/* The button sits in the card it applies to, not loose beneath it. */}
          <div className="flex justify-end bg-bg p-4">
            <button
              type="submit"
              className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg"
            >
              Save
            </button>
          </div>
        </div>
      </form>

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
