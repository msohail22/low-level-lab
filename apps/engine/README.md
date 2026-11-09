# engine

Sandboxed execution engine for untrusted C/C++. Runs on arrakis, never on
Workers: compiling someone's code needs a filesystem and processes, and
Cloudflare Workers has neither.

**This is a stub.** `src/main.cpp` prints one line. Ported from the
`quarantine` repository on 2026-11-09, which is where it already was.

The design is written and is the useful part: **`docs/arrakis/server-plan.md`**,
508 lines covering the isolation method, the accepted input, caching the
compiled program, per-run limits and the RAM budget. Read that before writing
code here.

## Unresolved: what language is this in?

The ported pieces disagree, and it was left that way rather than silently
picked:

| Says | Where |
|---|---|
| C++20, CMake, a binary called `quarantine-engine` | this directory |
| a service named `hono-engine` listening on port 3000 | `infra/engine/k8s/*`, `infra/engine/nginx/nginx.conf` |

Hono is a TypeScript web framework. So the manifests deploy an HTTP service
that this CMake project does not build, and the C++ target has no HTTP server
in it. One of the two is the plan and the other is left over.

This is the adopt-vs-build decision, T4 in `docs/todo-later.md`, and it is
unmade. It also decides D67: whether the `.tests.jsonl` contract becomes a
shared TypeScript package or a JSON Schema.

Likely shape, not a decision: a TypeScript HTTP service that accepts the
submission and queues it, with the sandbox itself a separate short-lived
process. That matches the manifests and keeps the C++ out of the request path.

## Build

```sh
cmake -S apps/engine -B apps/engine/build -DCMAKE_BUILD_TYPE=Release
cmake --build apps/engine/build
./apps/engine/build/quarantine-engine
```

Out-of-tree on purpose, so `**/build/` in `.gitignore` keeps the output out of
git. The old repository had a 50-file in-tree `build/` directory; it was not
ported.
