"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Provider as JotaiProvider, useSetAtom, useAtomValue } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { prefsAtom } from "@/lib/prefs-atoms";
import type { Prefs } from "@/lib/settings-shared";

/**
 * Puts the reader's settings in the client state the whole app shares, and
 * keeps the page in step with them.
 *
 * The order matters: the server has already rendered <html data-theme=...>
 * from the cookie, so the correct theme is in the first byte of HTML and there
 * is no flash. This layer only takes over afterwards, to apply a change
 * without a reload.
 */

/** Copies the server's values into the atom before the first paint. */
function Hydrate({ prefs, children }: { prefs: Prefs; children: ReactNode }) {
  const setPrefs = useSetAtom(prefsAtom);

  // A ref, not state: this must happen once, and re-running it would undo an
  // optimistic change the reader made in the meantime.
  const done = useRef(false);
  if (!done.current) {
    done.current = true;
    setPrefs(prefs);
  }

  return <>{children}</>;
}

/**
 * Applies the atom to <html>, which is where globals.css reads it from.
 *
 * Writing the attribute rather than a class, because that is exactly what the
 * server wrote. The two cannot disagree about the shape, only the value.
 */
function Apply() {
  const prefs = useAtomValue(prefsAtom);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.codeSize = prefs.codeSize;
  }, [prefs.theme, prefs.codeSize]);

  return null;
}

export function Providers({
  prefs,
  children,
}: {
  prefs: Prefs;
  children: ReactNode;
}) {
  // Built once per browser, inside state: a client created at module scope
  // would be shared between requests when this renders on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Settings change only when this reader changes them, and a
            // change already writes the cache itself. Refetching on every
            // window focus would be a request that can only return what we
            // already have.
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <Hydrate prefs={prefs}>
          <Apply />
          {children}
        </Hydrate>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
