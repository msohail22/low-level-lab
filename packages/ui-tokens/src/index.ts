/** Shared design tokens — platform-agnostic.
 * Dark palette mirrors Omarchy/nvim **matteblack** / matte-black
 * (accent #e68e0d, bg #121212, fg #bebebe / #eaeaea).
 */

export type ColorTokens = {
  ink: string;
  accent: string;
  accentBtn: string;
  onAccent: string;
  surface: string;
  surface2: string;
  line: string;
  muted: string;
  panel: string;
  canvas: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warn: string;
  warnBg: string;
  info: string;
  infoBg: string;
};

/** Dark = matteblack (current nvim / omarchy theme) */
export const darkColors: ColorTokens = {
  ink: "#eaeaea",
  accent: "#e68e0d",
  accentBtn: "#f59e0b",
  onAccent: "#0d0d0d",
  surface: "#121212",
  surface2: "#212121",
  line: "#333333",
  muted: "#8a8a8d",
  panel: "#1a1a1a",
  canvas: "#0d0d0d",
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
  accent: "#d97706",
  accentBtn: "#e68e0d",
  onAccent: "#0d0d0d",
  surface: "#fafafa",
  surface2: "#f0f0f0",
  line: "#e4e4e7",
  muted: "#71717a",
  panel: "#ffffff",
  canvas: "#f4f4f5",
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
  pill: "999px",
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
  fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  monoFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

export function colorsToCssVars(c: ColorTokens): Record<string, string> {
  return {
    "--ink": c.ink,
    "--accent": c.accent,
    "--accent-btn": c.accentBtn,
    "--on-accent": c.onAccent,
    "--surface": c.surface,
    "--surface-2": c.surface2,
    "--line": c.line,
    "--muted": c.muted,
    "--panel": c.panel,
    "--white": c.panel,
    "--canvas": c.canvas,
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
  source: "nvim matteblack / omarchy matte-black",
  accent: "#e68e0d",
  background: "#121212",
} as const;
