"use client";

import { useAtom } from "jotai";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prefsAtom, PREFS_QUERY_KEY } from "@/lib/prefs-atoms";
import { SETTINGS, type Prefs } from "@/lib/settings-shared";

/**
 * The settings controls.
 *
 * Pressing an option saves it. There is no Save button: one setting is one
 * value, so a button would only add a step where a change could be lost by
 * navigating away.
 *
 * The change is optimistic — the atom moves first, so the theme flips under
 * the pointer — and the server's answer replaces it. If the request fails the
 * previous value comes back and the reason is shown, so the page never claims
 * something was saved when it was not.
 */

async function fetchPrefs(): Promise<Prefs> {
  const response = await fetch("/api/settings", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Could not load your settings.");
  return response.json();
}

async function patchPrefs(changes: Partial<Prefs>): Promise<Prefs> {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!response.ok) throw new Error("Could not save. Your change was undone.");
  return response.json();
}

export function SettingsForm({ initialPrefs }: { initialPrefs: Prefs }) {
  const [prefs, setPrefs] = useAtom(prefsAtom);
  const queryClient = useQueryClient();

  /*
   * The server already sent the settings with the page, so this starts as a
   * hit rather than a request. It exists for the trip back: after a save on
   * another tab, or a refetch, the query is the one place the fresh values
   * arrive and the atom follows them.
   */
  const { data } = useQuery({
    queryKey: PREFS_QUERY_KEY,
    queryFn: fetchPrefs,
    initialData: initialPrefs,
  });

  const save = useMutation({
    mutationFn: patchPrefs,

    onMutate: async (changes) => {
      // Stop a read in flight from landing on top of the optimistic value.
      await queryClient.cancelQueries({ queryKey: PREFS_QUERY_KEY });

      const previous = prefs;
      const next = { ...prefs, ...changes };
      setPrefs(next);
      queryClient.setQueryData(PREFS_QUERY_KEY, next);

      // Handed to onError as the way back.
      return { previous };
    },

    onError: (_error, _changes, context) => {
      if (!context) return;
      setPrefs(context.previous);
      queryClient.setQueryData(PREFS_QUERY_KEY, context.previous);
    },

    // The server answers with the whole set, so this is the truth, not a echo
    // of what was sent.
    onSuccess: (saved) => {
      setPrefs(saved);
      queryClient.setQueryData(PREFS_QUERY_KEY, saved);
    },
  });

  // The query is the source the controls read, so a value that arrived from
  // elsewhere is shown even before the atom has caught up.
  const current = data ?? prefs;

  return (
    <div>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {SETTINGS.map((setting) => (
          <div
            key={setting.key}
            className="p-4 sm:flex sm:items-center sm:justify-between sm:gap-6"
          >
            <div className="sm:min-w-0">
              <p className="text-sm font-medium">{setting.label}</p>
              <p className="mt-0.5 text-sm text-muted">{setting.hint}</p>
            </div>

            <div
              role="radiogroup"
              aria-label={setting.label}
              className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0"
            >
              {setting.options.map((option) => {
                const selected = current[setting.key] === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={save.isPending}
                    onClick={() => save.mutate({ [setting.key]: option.value })}
                    className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm whitespace-nowrap disabled:cursor-wait ${
                      selected
                        ? "border-accent font-medium"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Only ever shown after a real failure. Success is the page changing. */}
      {save.isError ? (
        <p role="alert" className="mt-3 text-sm text-hard">
          {save.error.message}
        </p>
      ) : null}
    </div>
  );
}
