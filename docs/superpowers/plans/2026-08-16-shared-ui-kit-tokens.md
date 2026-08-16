# Shared UI Kit + Tokens Implementation Plan

> **For agentic workers:** Implement task-by-task. Checkbox tracking optional.

**Goal:** Add `@llb/ui-tokens` and Radix-backed `apps/web/src/components/ui`, cut over web pages; no visual redesign.

**Architecture:** Tokens package → CSS vars; UI kit uses Radix + CVA + Tailwind; pages import `@/components/ui`.

**Tech Stack:** pnpm workspace, Radix Select/Checkbox/Label/Slot, CVA, clsx, tailwind-merge, Tailwind 4

---

### Task 1: `@llb/ui-tokens`
### Task 2: Web deps + `cn` + UI primitives
### Task 3: Cut over pages; clean `index.css`
### Task 4: Typecheck/lint; commit+push
