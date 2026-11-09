"use client";

import { atom } from "jotai";
import { DEFAULTS, type Prefs } from "./settings-shared";

/**
 * The reader's settings as client state.
 *
 * One atom holding the whole set, not one atom per setting. The server always
 * answers with the full set, so a single atom is replaced in one write and can
 * never hold a mix of old and new values.
 *
 * It starts at DEFAULTS and is hydrated from the server on mount — see
 * components/Providers.tsx. The server has already rendered the page with the
 * real values, so this is a handover, not a first load.
 */
export const prefsAtom = atom<Prefs>(DEFAULTS);

/** The query key TanStack Query stores the same data under. */
export const PREFS_QUERY_KEY = ["settings"] as const;
