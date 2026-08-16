# Shared types package (`@llb/shared`) — Design

**Date:** 2026-08-16  
**Status:** Approved for planning  
**Scope choice:** C — API contracts (Zod + inferred types) + shared enums/constants; exclude component props and Hono/Worker-only types

## Goal

Single source of truth for cross-app TypeScript types and Zod request schemas so `apps/api` and `apps/web` do not redefine the same shapes. Reduce drift between API validation and web payload typing.

## Non-goals

- Moving Drizzle DB schemas into shared
- Sharing React components or UI prop types
- Sharing Hono `AppEnv` / `CloudflareBindings` / middleware types
- OpenAPI generation or a separate shared build pipeline (v1 uses TypeScript source exports)
- Changing API behavior or response JSON shapes

## Approach

**Zod-first contracts package** (chosen over types-only or OpenAPI generation):

- Shared package owns Zod schemas for request bodies already validated in the API
- Export `z.infer` types alongside schemas
- Export response DTO types as TypeScript types matching current JSON responses
- Export enums/constants (`questionTypes`, `difficulties`, statuses, UI event names, achievement slug consts)

## Package layout

```
packages/shared/
  package.json          # name: @llb/shared
  src/
    index.ts            # public barrel
    constants.ts        # questionTypes, difficulties, statuses, ui event names, etc.
    questions.ts        # create/review schemas + question DTOs
    learn.ts            # submitAttempt + practice/attempt/leaderboard DTOs
    platform.ts         # challenge, achievements, sets, glossary, reports, comments
    study.ts            # mastery, continue, votes, duplicates, ui events, playlist
    me.ts               # /api/me payload
```

## What moves into `@llb/shared`

- Constants: question types, difficulties, question statuses, UI event name unions/consts, achievement slugs as const where useful
- Zod request schemas from API today (`createQuestionSchema`, `submitAttemptSchema`, and related body schemas for study/platform routes where duplicated or validated with inline zod)
- Response DTO types currently redeclared in web pages (practice question, attempt result, mastery topic, continue payload, leaderboard entry, achievements, glossary, sets, challenge, author reputation, me/roles, moderation list rows, etc.)

## What stays local

- `apps/api/src/db/schema.ts` (Drizzle)
- Hono route `AppEnv`, session middleware types, Cloudflare bindings
- React-only props (`AppShellProps`, filter component props)
- Implementation-only helpers (e.g. ui-analytics queue mechanics may import `UiEvent` from shared but keep local storage keys)

## Wiring

- Package name: `@llb/shared`
- `"type": "module"`
- Exports map pointing at `./src/index.ts` for both `types` and `import` (no compile step in v1)
- Dependencies: `zod` (align major with apps)
- `apps/api` and `apps/web`: `"@llb/shared": "workspace:*"`
- Workspace already includes `packages/*`

## Migration rules

1. Scaffold package + constants
2. Move/create Zod schemas and request types; API imports from `@llb/shared` and deletes local duplicates
3. Add response DTO types matching existing JSON (no renames that break clients)
4. Web imports types from `@llb/shared`; delete page-local mirrors
5. Verify with API `typecheck` and web `tsc` + lint

Prefer exporting both schema + inferred type for every shared request body. Response Zod parsing is out of scope for v1 unless a specific endpoint already needs it.

## Error handling / compatibility

- Pure refactor: no intentional HTTP or JSON shape changes
- If a web local type was a subset of the API response, widen to the shared DTO rather than inventing a second partial type unless the UI truly needs a pick/omit helper in shared

## Testing / verification

- `pnpm --dir apps/api typecheck`
- `pnpm --dir apps/web exec tsc --noEmit`
- `pnpm --dir apps/web lint`
- Spot-check that shared package resolves under Vite and Wrangler/tsc

## Rollout order

1. Scaffold `@llb/shared`
2. Constants
3. Request Zod schemas (API cutover)
4. Response DTOs
5. Web cutover
6. Typecheck / lint

## Risks

- Wrangler/Vite may need explicit optimizeDeps or alias if resolution fails — fix in app config if encountered
- Large one-shot import sweep; keep commits focused on shared package + consumer updates
