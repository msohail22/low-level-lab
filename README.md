# Low Level Lab

> A project to learn programming by practice (a lot of practice).

A site where people read programming questions and solve them on their own
machine.

## Layout

A pnpm workspace. Two things deploy, to two different machines:

| Path | What | Deploys to |
|---|---|---|
| `apps/web` | the site: questions, auth, progress | Cloudflare Workers |
| `apps/engine` | sandboxed execution engine for untrusted C/C++ | arrakis |
| `infra/arrakis` | the machine: OpenTofu, libvirt, host config | — |
| `infra/engine` | k8s manifests, nginx, Argo CD for the engine | — |
| `docs` | the plan, the parking lot, the arrakis history | — |

`apps/web` is the whole site and runs on Workers, which has no filesystem and
no processes. Compiling someone's C++ needs both, so the engine can never live
there. That split is why this is a workspace and not one package.

## Running it

Every script runs from this directory, not from inside a package.

```sh
pnpm install
pnpm dev        # http://[::1]:5173
pnpm validate   # every question against the format contract
pnpm typecheck
pnpm build
```

The engine is separate and still a stub:

```sh
cmake -S apps/engine -B apps/engine/build && cmake --build apps/engine/build
```

## Contributing a question

One MDX file per question at `apps/web/content/<topic>/<slug>.mdx`, where the
filename equals the `slug` in the frontmatter. `pnpm validate` is the review —
it checks frontmatter, required headings, choice counts and test files, and CI
runs it on every pull request. Read an existing question in
`apps/web/content/cpp/` before writing a new one.
