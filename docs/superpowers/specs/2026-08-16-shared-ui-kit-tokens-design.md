# Shared Web UI Kit + Tokens Design

**Date:** 2026-08-16  
**Status:** Approved for planning  
**Repo:** `msohail22/low-level-lab` (default branch: `master`)

## Goal

1. Introduce **`@llb/ui-tokens`** for shared design tokens (colors, spacing, radii, typography) usable later by React Native
2. Build a **headless-backed UI kit** under `apps/web/src/components/ui/` (Radix + CVA + Tailwind)
3. Cut over web pages to import from `@/components/ui` instead of ad-hoc `auth-*` classes / raw controls

**This commit does not redesign the product.** Tokens and component paint match the current look. A separate look/feel conversation comes after Docker Compose Postgres work.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Web components location | `apps/web/src/components/ui/` |
| Tokens package | `packages/ui-tokens` → `@llb/ui-tokens` |
| RN reuse model | Same component *names/API* later; tokens shared; RN implementations separate |
| Approach | Headless Radix + CVA + Tailwind (Approach 3) |
| Kit scope | Button, Input, Textarea, Select, Label, Field, LinkButton, Checkbox, Badge, Card, Alert |
| Visual redesign | Out of scope for this commit |

## Architecture

```text
@llb/ui-tokens
  └─ JS token objects + CSS variable names (current palette)

apps/web
  ├─ index.css     → :root variables sourced from tokens; global layout only
  └─ components/ui → Radix-backed primitives styled with tokens via Tailwind/CVA
        pages/**   → import from @/components/ui
```

## Tokens (`@llb/ui-tokens`)

Export at least:

- **Colors:** `ink`, `accent`, `accentBtn`, `surface`, `surface2`, `line`, `muted`, `white`, danger/success/warn (semantic, mapped to current accents where needed)
- **Radii:** e.g. control `0.75rem`, card `1rem`, pill `999px`
- **Spacing:** small scale used by controls
- **Typography:** font family stack (`IBM Plex Sans`, …)

Provide a `cssVariables` (or `toCssVars()`) mapping so web can set `:root` without inventing a second palette.

## Web UI components

| Component | Behavior |
|-----------|----------|
| `cn` | `clsx` + `tailwind-merge` |
| `Button` | variants: `primary` \| `secondary` \| `ghost` \| `danger`; sizes: `sm` \| `md` \| `lg`; `asChild` via `@radix-ui/react-slot` |
| `LinkButton` | Router `Link` + Button styles (`asChild` or dedicated wrapper) |
| `Input` / `Textarea` | token-styled; forward refs; native semantics |
| `Select` | `@radix-ui/react-select` compound API (Root/Trigger/Content/Item) + optional thin helper |
| `Checkbox` | `@radix-ui/react-checkbox` |
| `Label` | `@radix-ui/react-label` |
| `Field` | Label + control + optional hint/error text |
| `Badge` | `muted` \| `accent` \| `success` \| `warn` |
| `Card` | surface panel (replaces most `surface-card` for content/interaction) |
| `Alert` | `info` \| `success` \| `error` |

Barrel: `apps/web/src/components/ui/index.ts`.

## Dependencies (web)

- `@radix-ui/react-select`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-label`
- `@radix-ui/react-slot`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

## Cutover

- Replace `auth-primary-btn`, `auth-secondary-btn`, `auth-input`, raw `<select>`, obvious card/alert patterns across `apps/web/src`
- Remove unused `auth-*` / `surface-card` rules from `index.css` once unused (or leave deprecated comments briefly)
- Keep section eyebrow/title/copy globals unless trivially unused

## Out of scope

- Visual/brand redesign
- Docker Compose Postgres (next workstream)
- React Native UI implementations
- Changing Reactor / API contracts

## Success criteria

- Pages use `@/components/ui` for buttons, inputs, textareas, selects, checkboxes, badges, cards, alerts
- `@llb/ui-tokens` is a workspace package consumed by web
- Select dropdowns are Radix-based
- Lint/typecheck/build for web still pass
- Look remains recognizably the current theme (no intentional redesign)
