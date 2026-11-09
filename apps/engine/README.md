# engine

Compiles and runs untrusted **C++** against a question's test cases. Runs on
arrakis, never on Cloudflare Workers: compiling needs a filesystem and
processes, and Workers has neither.

Not built yet. This directory holds the decisions and nothing else.

## Scope: C++ only

`docs/arrakis/server-plan.md` §5.2 also accepts C and GNU `as` assembly. Both
are deferred. The only topic that exists is `cpp` (`apps/web/lib/topics.ts`),
so anything else would be a feature with no question behind it.

## The sandbox is not ours

[`isolate`](https://github.com/ioi/isolate) already implements every layer
§5.3 asks for: cgroup v2, user/mount/PID/network namespaces, seccomp-bpf,
rlimits, `no_new_privs`. It is what the IOI grades on, and it is maintained
(v2.7, 2026-08-24). Hand-writing a seccomp filter is how you ship your own CVE.

isolate runs setuid root and compiles nothing. We compile, then hand it the
binary.

## Shape

```
POST /run  {source, slug}
   │
   ├─ 1. write source to a temp dir
   ├─ 2. g++ ...                      ← compile, OUTSIDE the sandbox
   ├─ 3. isolate --cg --run ...       ← the security-critical step, not ours
   └─ 4. read the --meta file → {stdout, time, killed, exitcode}
```

TypeScript and Hono, port 3000. Same language as `apps/web`, so the
`.tests.jsonl` contract becomes one shared Zod schema instead of two copies
that drift.

No compile cache and no sandbox pool. Latency is acceptable, and dropping both
also drops §10.6 — which language standards to cache — because nothing is
keyed any more.

## It runs as a systemd unit, not in Kubernetes

Decided 2026-11-09. §5.4 gives the reason: a sandbox inside a container must
create namespaces inside namespaces, which needs more rights and adds delay.
isolate's own man page agrees and says running in containers is "not
recommended".

`infra/engine/` used to hold k8s manifests, an nginx proxy and an Argo CD
`Application` for a service named `hono-engine` on port 3000. They described a
service that never existed and contradicted this decision, so they were
removed on 2026-11-09. The unit file replaces them and is not written yet.

## Why there is no C++ in this directory

`src/main.cpp` printed one line. It was removed on 2026-11-09 along with
`CMakeLists.txt`, `.clangd` and its `build/` tree. It implied the engine would
be written in C++, which was never the plan: the C++ here is the *input*, not
the implementation. The implementation that matters is isolate, and it is
already written, in C, by someone else.
