/**
 * Reader settings: the part that is only data.
 *
 * This file is imported by client components, so it must not reach a server
 * module. Anything touching D1 or KV lives in ./settings, which re-exports
 * everything here — a server file can import one module as before, while the
 * browser bundle cannot pull `cloudflare:workers` in behind it.
 *
 * D1 is the source of truth — one `kind = 'setting'` row per setting, the
 * shape `lib/db/schema.ts` already defines, so a setting follows the reader to
 * another browser. A cookie mirrors the same values as a cache, because every
 * page has to apply the theme and no page should pay a database read to do it.
 * The cookie is rewritten on save and on sign-in, never trusted as the truth:
 * a value it does not recognise falls back to the default.
 */

/** One option a setting may hold. */
type Option = { value: string; label: string };

/** The settings a reader can change. Adding one here adds it to the page. */
export const SETTINGS = [
  {
    key: "theme",
    default: "system",
    label: "Theme",
    hint: "System follows your operating system.",
    options: [
      { value: "system", label: "System" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
  },
  {
    key: "codeSize",
    default: "normal",
    label: "Code size",
    hint: "The text size inside code blocks.",
    options: [
      { value: "small", label: "Small" },
      { value: "normal", label: "Normal" },
      { value: "large", label: "Large" },
    ],
  },
  {
    key: "revealAnswers",
    default: "off",
    label: "Answers",
    hint: "Open the answer straight away instead of pressing Show answer.",
    options: [
      { value: "off", label: "Hidden until asked" },
      { value: "on", label: "Open by default" },
    ],
  },
] as const satisfies readonly {
  key: string;
  default: string;
  label: string;
  hint: string;
  options: readonly Option[];
}[];

export type SettingKey = (typeof SETTINGS)[number]["key"];

export type Prefs = { [K in SettingKey]: string };

/** Each setting names its own default; it is not simply the first option. */
export const DEFAULTS: Prefs = Object.fromEntries(
  SETTINGS.map((s) => [s.key, s.default]),
) as Prefs;

/** True when `value` is one of the options declared for `key`. */
export function isValid(key: string, value: string): key is SettingKey {
  const setting = SETTINGS.find((s) => s.key === key);
  return !!setting && setting.options.some((o: Option) => o.value === value);
}

/** Fills in every missing or unknown value with its default. */
export function normalise(raw: Partial<Record<string, string>>): Prefs {
  const out = { ...DEFAULTS };
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && isValid(key, value)) out[key] = value;
  }
  return out;
}

/* --- the cookie cache ---------------------------------------------------- */

export const PREFS_COOKIE = "llprefs";

/** A year. A preference is not a session, so it outlives one. */
export const PREFS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function encodePrefs(prefs: Prefs): string {
  return new URLSearchParams(prefs).toString();
}

export function decodePrefs(raw: string | undefined): Prefs {
  if (!raw) return DEFAULTS;
  return normalise(Object.fromEntries(new URLSearchParams(raw)));
}

