# Repository Guidelines

## Project Structure & Module Organization

This repository is a React + TypeScript app built with Vite and deployed as a Cloudflare Worker. Frontend source lives in `src/`, with the app entry at `src/main.tsx`, UI logic in `src/App.tsx`, and global styles/Tailwind import in `src/index.css`. Worker code lives in `worker/index.ts`. Cloudflare deployment settings are in `wrangler.jsonc`, and Vite configuration is in `vite.config.ts`.

There is currently no dedicated test directory. Add future tests near the code they cover or under a clear `src/__tests__/` directory.

## Build, Test, and Development Commands

Use pnpm 11, as pinned in `package.json`.

- `pnpm install --frozen-lockfile`: install dependencies exactly from `pnpm-lock.yaml`.
- `pnpm dev`: start the local Vite development server.
- `pnpm build`: type-check the project and build both Worker and client output.
- `pnpm preview`: build and preview the app locally through Vite.
- `pnpm lint`: run ESLint across the repository.
- `pnpm deploy`: build and deploy with Wrangler.
- `pnpm cf-typegen`: regenerate Cloudflare Worker types.

## Coding Style & Naming Conventions

Use TypeScript and React functional components. Keep component names in `PascalCase`, variables/functions in `camelCase`, and files aligned with their main export where practical. Existing files use two-space indentation in TypeScript/CSS and tabs in `package.json`; follow the surrounding file style.

Tailwind is available via `@import 'tailwindcss';` in `src/index.css`. Prefer Tailwind utilities for new UI work, while keeping shared base styles in `src/index.css` when they apply globally.

## Testing Guidelines

No test framework is currently configured. Before adding behavioral changes, consider adding a lightweight React/Vite-compatible test setup. Until then, run `pnpm lint` and `pnpm build` before committing. For Cloudflare deployment changes, also run `pnpm exec wrangler deploy --dry-run --config wrangler.jsonc`.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit messages such as `Add Tailwind CSS` and `Fix Cloudflare Workers build config`. Keep commits focused and descriptive.

Pull requests should include a brief summary, verification commands run, and screenshots for UI changes. Link related issues when available, and call out Cloudflare configuration changes explicitly.

## Security & Configuration Tips

Do not commit `.dev.vars*`, `.env*`, `.wrangler/`, `dist/`, or secrets. Keep Cloudflare build settings aligned with `package.json`: Node `>=24` and pnpm `11.22.0`.
