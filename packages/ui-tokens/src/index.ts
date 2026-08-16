/** Shared design tokens — platform-agnostic. Web maps these to CSS vars; RN will use StyleSheet later. */

export const colors = {
  ink: "#1a1a1a",
  accent: "#2f6f5e",
  accentBtn: "#3a8571",
  surface: "#f7f7f5",
  surface2: "#eceae4",
  line: "#ddd9d0",
  muted: "#6b6560",
  white: "#ffffff",
  canvas: "#fbfaf7",
  danger: "#b42318",
  dangerBg: "#fef3f2",
  success: "#027a48",
  successBg: "#ecfdf3",
  warn: "#b54708",
  warnBg: "#fffaeb",
  info: "#026aa2",
  infoBg: "#f0f9ff",
} as const;

export const radii = {
  control: "0.75rem",
  card: "1rem",
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

/** CSS custom property map for web `:root` */
export const cssVariables: Record<string, string> = {
  "--ink": colors.ink,
  "--accent": colors.accent,
  "--accent-btn": colors.accentBtn,
  "--surface": colors.surface,
  "--surface-2": colors.surface2,
  "--line": colors.line,
  "--muted": colors.muted,
  "--white": colors.white,
  "--canvas": colors.canvas,
  "--danger": colors.danger,
  "--danger-bg": colors.dangerBg,
  "--success": colors.success,
  "--success-bg": colors.successBg,
  "--warn": colors.warn,
  "--warn-bg": colors.warnBg,
  "--info": colors.info,
  "--info-bg": colors.infoBg,
  "--radius-control": radii.control,
  "--radius-card": radii.card,
  "--radius-pill": radii.pill,
  "--font-sans": typography.fontFamily,
  "--font-mono": typography.monoFamily,
};

export function cssVariablesBlock(): string {
  return Object.entries(cssVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
}
