# Repository Guidelines

## Project Structure & Module Organization

This repository contains TypeScript applications:

- `apps/web/`: React 19 and Vite frontend. Code is in `src/`; the Cloudflare Worker entry point is `worker/index.ts`.
- `apps/api/`: Hono API for Cloudflare Workers. Middleware lives under `src/`, with database code in `src/db/`.
- `apps/mobile/`: React Native app, including native projects in `android/` and `ios/`. Jest tests live in `__tests__/`.
- `shared/`: reusable schemas and code. Add shared contracts here instead of duplicating them.
- `docs/`: architecture and design documentation.

Keep generated and platform build output out of version control.

## Build, Test, and Development Commands

Use Node.js 22.11+ and pnpm 10.30. Because the workspace file is empty, run package commands explicitly:

- `pnpm --dir apps/web dev`: start the Vite web development server.
- `pnpm --dir apps/web build`: type-check and build the web app.
- `pnpm --dir apps/web lint`: lint web TypeScript and React code.
- `pnpm --dir apps/api dev`: run the API locally with Wrangler.
- `pnpm --dir apps/api cf-typegen`: regenerate Cloudflare binding types.
- `pnpm --dir apps/mobile start`: start Metro.
- `pnpm --dir apps/mobile android` or `ios`: launch the native app.
- `pnpm --dir apps/mobile test`: run Jest tests.

Do not use the root `pnpm test`; it is a placeholder that intentionally fails.

## Coding Style & Naming Conventions

Use strict TypeScript and keep modules focused. Follow the style already used in each package: two-space indentation, `PascalCase` for React components and types, `camelCase` for functions and variables, and descriptive lowercase filenames such as `logger.ts`. Web code is checked by ESLint; mobile code uses the React Native ESLint preset and Prettier. Avoid unused parameters, unchecked values, and duplicated validation; use Zod for external data boundaries.

## Testing Guidelines

Mobile tests use Jest with `react-test-renderer`. Name tests `*.test.ts` or `*.test.tsx` and place them in `__tests__/` near the feature. Add tests for behavior changes and regressions. Web and API packages do not yet define test runners, so at minimum run their build, lint, or Wrangler type-generation commands as applicable.

## Commit & Pull Request Guidelines

Recent commits use short, imperative summaries such as `Refactor code structure for improved readability and maintainability`. Keep each commit scoped to one logical change. Pull requests should explain the problem and solution, list verification commands, link related issues, and include screenshots or recordings for visible web or mobile changes. Never commit secrets from `.env` or Cloudflare credentials.
