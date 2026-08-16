# UI theme: matteblack + light/dark

**Date:** 2026-08-16  
**Status:** Implemented  

## Source

Omarchy theme name `matte-black` / nvim colorscheme `matteblack`  
(`~/.config/omarchy/current/theme`, `~/.config/nvim/lua/plugins/theme.lua`)

| Role | Dark (default) | Light |
|------|----------------|-------|
| Accent | `#e68e0d` | `#d97706` / `#e68e0d` |
| Canvas / surface | `#0d0d0d` / `#121212` | `#f4f4f5` / `#fafafa` |
| Ink | `#eaeaea` | `#121212` |
| Muted / line | `#8a8a8d` / `#333333` | `#71717a` / `#e4e4e7` |

## App behavior

- Default theme: **dark** (matteblack)
- Toggle in AppShell + Home/Login/Register
- Persisted in `localStorage` key `llb-theme`
- Tokens: `packages/ui-tokens` (`darkColors` / `lightColors`)
