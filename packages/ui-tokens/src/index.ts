/** Shared design tokens — platform-agnostic.
 * Dark palette mirrors Neovim **matteblack** (tahayvr/matteblack.nvim)
 * (accent #f59e0b, bg #121212, fg #eaeaea).
 */

export type ColorTokens = {
  ink: string;
  fgBright: string;
  fgSecondary: string;
  accent: string;
  accentBtn: string;
  onAccent: string;
  surface: string;
  surface2: string;
  surfaceActive: string;
  line: string;
  muted: string;
  panel: string;
  canvas: string;
  gold: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warn: string;
  warnBg: string;
  info: string;
  infoBg: string;
};

/** Dark = matteblack (current nvim matteblack theme) */
export const darkColors: ColorTokens = {
  ink: "#eaeaea",
  fgBright: "#ffffff",
  fgSecondary: "#bebebe",
  accent: "#f59e0b",
  accentBtn: "#f59e0b",
  onAccent: "#0d0d0d",
  surface: "#121212",
  surface2: "#212121",
  surfaceActive: "#262626",
  line: "#333333",
  muted: "#8a8a8d",
  panel: "#212121",
  canvas: "#0d0d0d",
  gold: "#efbf04",
  danger: "#dc2626",
  dangerBg: "#2a1212",
  success: "#10b981",
  successBg: "#0f241c",
  warn: "#d97706",
  warnBg: "#2a1f0a",
  info: "#3b82f6",
  infoBg: "#111827",
};

/** Light companion — same amber accent, paper surfaces */
export const lightColors: ColorTokens = {
  ink: "#121212",
  fgBright: "#0d0d0d",
  fgSecondary: "#52525b",
  accent: "#d97706",
  accentBtn: "#f59e0b",
  onAccent: "#0d0d0d",
  surface: "#fafafa",
  surface2: "#f0f0f0",
  surfaceActive: "#e4e4e7",
  line: "#e4e4e7",
  muted: "#71717a",
  panel: "#ffffff",
  canvas: "#f4f4f5",
  gold: "#d97706",
  danger: "#b91c1c",
  dangerBg: "#fef2f2",
  success: "#059669",
  successBg: "#ecfdf5",
  warn: "#b45309",
  warnBg: "#fffbeb",
  info: "#2563eb",
  infoBg: "#eff6ff",
};

/** @deprecated use lightColors — kept for older imports */
export const colors = lightColors;

export const radii = {
  control: "0.5rem",
  card: "0.75rem",
  pill: "9999px",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
} as const;

export const typography = {
  fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  monoFamily: 'ui-monospace, SFMono-Regular, "JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
} as const;

export function colorsToCssVars(c: ColorTokens): Record<string, string> {
  return {
    "--ink": c.ink,
    "--fg-bright": c.fgBright,
    "--fg-secondary": c.fgSecondary,
    "--accent": c.accent,
    "--accent-btn": c.accentBtn,
    "--on-accent": c.onAccent,
    "--surface": c.surface,
    "--surface-2": c.surface2,
    "--surface-active": c.surfaceActive,
    "--line": c.line,
    "--muted": c.muted,
    "--panel": c.panel,
    "--white": c.panel,
    "--canvas": c.canvas,
    "--gold": c.gold,
    "--danger": c.danger,
    "--danger-bg": c.dangerBg,
    "--success": c.success,
    "--success-bg": c.successBg,
    "--warn": c.warn,
    "--warn-bg": c.warnBg,
    "--info": c.info,
    "--info-bg": c.infoBg,
  };
}

export const cssVariablesLight = {
  ...colorsToCssVars(lightColors),
  "--radius-control": radii.control,
  "--radius-card": radii.card,
  "--radius-pill": radii.pill,
  "--font-sans": typography.fontFamily,
  "--font-mono": typography.monoFamily,
};

export const cssVariablesDark = {
  ...colorsToCssVars(darkColors),
  "--radius-control": radii.control,
  "--radius-card": radii.card,
  "--radius-pill": radii.pill,
  "--font-sans": typography.fontFamily,
  "--font-mono": typography.monoFamily,
};

/** @deprecated use cssVariablesLight */
export const cssVariables = cssVariablesLight;

export function cssVariablesBlock(
  vars: Record<string, string> = cssVariablesLight,
): string {
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
}

export const themeMeta = {
  name: "matteblack",
  source: "tahayvr/matteblack.nvim",
  accent: "#f59e0b",
  background: "#0d0d0d",
} as const;
