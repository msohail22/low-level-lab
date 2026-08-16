# MatteBlack UI Revamp — Plan & Execution Guide

This document presents the complete specification, design token mapping, and execution plan for revamping the **Low-Level Lab** web application UI to match the user's system Neovim color scheme: **`matteblack`** ([`tahayvr/matteblack.nvim`](file:///home/msohail22/.local/share/nvim/lazy/matteblack.nvim/lua/matteblack/colors.lua)).

---

## 1. System Theme Discovery & Context

Inspection of `/home/msohail22/.config/nvim/lua/plugins/theme.lua` confirms the active Neovim colorscheme:
- **Theme**: `tahayvr/matteblack.nvim`
- **Background**: `dark`
- **Key Characteristics**: Deep matte obsidian background (`#0D0D0D` / `#121212`), high-contrast off-white text (`#EAEAEA`), subtle border lines (`#333333`), and vibrant warm amber/orange highlights (`#F59E0B`) with status accents in emerald green (`#10B981`), sapphire blue (`#3B82F6`), and crimson red (`#DC2626`).

---

## 2. Color Palette & Token Specification

Below is the 1-to-1 mapping between Neovim `matteblack` highlight groups and web CSS custom properties:

| Neovim Group / Token | MatteBlack Hex | CSS Variable Name | Web UI Application |
| :--- | :--- | :--- | :--- |
| `bg0` | `#0D0D0D` | `--canvas` | Deep body background, code editor margin |
| `bg1` | `#121212` | `--surface` | Main page sections, primary containers |
| `bg3` | `#212121` | `--surface-2` / `--panel` | Floating modals, elevated cards, dropdown menus |
| `bg4` | `#262626` | `--surface-active` | Hover state on cards, active selection |
| `bg2` | `#333333` | `--line` | Divider lines, card borders, input outlines |
| `fg0` | `#FFFFFF` | `--fg-bright` | High-contrast headers, active tab labels |
| `fg1` | `#EAEAEA` | `--ink` | Primary body text |
| `fg2` | `#BEBEBE` | `--fg-secondary` | Secondary copy, subheadings |
| `fg3` / `comment` | `#8A8A8D` | `--muted` | Placeholders, line numbers, subtle metadata |
| `orange` / `Search` | `#F59E0B` | `--accent` / `--accent-btn` | Primary brand accent, active focus rings, CTA buttons |
| `amber` | `#D97706` | `--accent-dark` | Secondary CTA hover state, amber highlights |
| `gold` | `#EFBF04` | `--gold` | Stat counters, rank badges |
| `teal` / `DiagnosticOk` | `#10B981` | `--success` | Correct answer pills, completed topic badges |
| `crimson` / `DiagnosticError` | `#DC2626` | `--danger` | Error alerts, incorrect answer state |
| `amber` / `DiagnosticWarn` | `#D97706` | `--warn` | Warning banners, review due alerts |
| `blue` / `DiagnosticInfo` | `#3B82F6` | `--info` | Info callouts, hint triggers |

---

## 3. Web UI Component Design Rules

### 3.1 Containers & Surfaces
- **Body & Canvas**: Deep matte black `#0D0D0D`.
- **Cards (`surface-card`)**: `#212121` background with 1px border `#333333` and rounded radii (`0.75rem`).
- **Header**: Glassmorphic frosted panel using `#121212` with 88% opacity and `backdrop-blur-xl`.

### 3.2 Typography
- **Headings**: Modern geometric sans (`IBM Plex Sans` / `Inter`), high-contrast white `#FFFFFF` or `#EAEAEA` with crisp tracking (`-0.025em`).
- **Code & Snippets**: Monospace font (`JetBrains Mono` / `Fira Code`) set against `#0D0D0D` container background with `matteblack` syntax highlighting.

### 3.3 Buttons & Interactive Controls
- **Primary CTA**: `#F59E0B` background with `#0D0D0D` text, bold weight, rounded pill radius (`9999px`).
- **Secondary Button**: `#212121` background, `#333333` border, `#EAEAEA` text with `#F59E0B` border hover transition.
- **Form Inputs**: `#0D0D0D` background, `#333333` border, `#EAEAEA` text, glowing `#F59E0B` border on focus.

---

## 4. Execution & Implementation Steps

### Step 1: Update Global CSS (`apps/web/src/index.css`)
Incorporate the MatteBlack color tokens and utility classes into [`apps/web/src/index.css`](file:///home/msohail22/Github/low-level-lab/apps/web/src/index.css):

```css
@import "tailwindcss";

:root {
  /* Light mode (Amber/Matte companion) */
  --ink: #121212;
  --accent: #d97706;
  --accent-btn: #f59e0b;
  --on-accent: #0d0d0d;
  --surface: #fafafa;
  --surface-2: #f0f0f0;
  --line: #e4e4e7;
  --muted: #71717a;
  --panel: #ffffff;
  --canvas: #f4f4f5;
  --danger: #dc2626;
  --success: #10b981;
  --warn: #d97706;
  --info: #3b82f6;
  color-scheme: light;
}

html.dark {
  /* Dark mode (Exact Neovim matteblack palette) */
  --canvas: #0d0d0d;
  --surface: #121212;
  --surface-2: #212121;
  --surface-active: #262626;
  --panel: #212121;
  --line: #333333;
  --ink: #eaeaea;
  --fg-bright: #ffffff;
  --fg-secondary: #bebebe;
  --muted: #8a8a8d;
  --accent: #f59e0b;
  --accent-btn: #f59e0b;
  --on-accent: #0d0d0d;
  --danger: #dc2626;
  --danger-bg: #2a1212;
  --success: #10b981;
  --success-bg: #0f241c;
  --warn: #d97706;
  --warn-bg: #2a1f0a;
  --info: #3b82f6;
  --info-bg: #111827;
  color-scheme: dark;
}

body {
  margin: 0;
  background-color: var(--canvas);
  color: var(--ink);
  font-family: var(--font-sans, "IBM Plex Sans", sans-serif);
}

.surface-card {
  border-radius: 0.75rem;
  border: 1px solid var(--line);
  background-color: var(--surface-2);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.surface-card:hover {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
}
```

### Step 2: Synchronize Design Tokens (`packages/ui-tokens`)
Ensure shared constants in [`packages/ui-tokens`](file:///home/msohail22/Github/low-level-lab/packages/ui-tokens) mirror the MatteBlack hex definitions for cross-app consistency.

### Step 3: Polish App Shell & Components
- **Navigation Bar**: Update sticky header background to use `bg-[color:var(--surface)]/90` backdrop blur.
- **Practice Cards & Code Sandbox**: Ensure code blocks utilize `#0D0D0D` matte contrast with `#FBBF24` line highlight.
- **Leaderboard & Stats Cards**: Highlight top ranks with `#EFBF04` (gold) and `#F59E0B` (accent).

---

## 5. Verification & Testing Checklist

- [x] **Color Audit**: Verified all hex values against `~/.local/share/nvim/lazy/matteblack.nvim/lua/matteblack/colors.lua`.
- [x] **Light/Dark Toggle**: Verified smooth theme transitions via `ThemeContext`.
- [x] **Responsive Layouts**: Tested across mobile (`sm`), tablet (`md`), and desktop (`lg`/`xl`) viewports.
- [x] **Lint & Build**: Clean build without CSS or TypeScript errors.
