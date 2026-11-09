# Low Level Lab

> A project to learn programming by practice (a lot of practice).

Read a programming question, solve it on your own machine.

## Layout

| Path | What |
|---|---|
| `apps/web` | the site — Cloudflare Workers |
| `apps/engine` | runs untrusted C++ — arrakis |
| `arrakis` | the server: OpenTofu, libvirt, host config |
| `docs` | the plan, the open work, the history |

## Running it

From this directory, not from inside a package.

```sh
pnpm install
pnpm dev          # the site, http://[::1]:5173
pnpm engine       # the engine, http://localhost:3000
pnpm validate     # every question against the format contract
pnpm typecheck
pnpm build
```

## Adding a question

One MDX file at `apps/web/content/<topic>/<slug>.mdx`, where the filename
equals the `slug` in the frontmatter. `pnpm validate` is the review, and CI runs
it on every pull request. Copy an existing question from
`apps/web/content/cpp/` rather than starting from scratch.
