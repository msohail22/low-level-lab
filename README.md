<div align="center">

# 🔬 Low Level Lab

**A project to learn programming by practice (a lot of practice).**

Read a question. Solve it on your own machine. Check your answer.

[![validate](https://github.com/msohail22/low-level-lab/actions/workflows/validate.yml/badge.svg)](https://github.com/msohail22/low-level-lab/actions/workflows/validate.yml)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![node](https://img.shields.io/badge/node-26.5-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[**Open the site →**](https://low-level-lab.msohail22.workers.dev)

[Contribute a question](CONTRIBUTING.md) · [Open work](docs/todo-later.md) · [The plan](docs/plan.md) · [Security](SECURITY.md)

</div>

---

## ✨ What it is

Programming questions as plain files in a git repository. No database, no CMS,
no submit box — **you compile locally**, which is the point. A reader who never
leaves the browser never learns the toolchain.

- 📝 **One MDX file per question.** Adding one is a pull request.
- ✅ **CI is the review.** A question that breaks the format cannot merge, so
  nobody has to read a diff to catch it.
- 🔒 **Answers hide behind a click**, so you commit before you peek.
- 🧪 **Four kinds** — `coding`, `mcq`, `multi`, `true-false`. All graded, never
  free text: an answer nobody can check is not worth typing.

## 🚀 Quick start

```sh
pnpm install
pnpm dev          # → http://[::1]:5173
```

```sh
pnpm validate     # every question against the format contract
pnpm typecheck
pnpm build
```

> [!NOTE]
> The dev server binds IPv6. Use `http://[::1]:5173`, not `localhost`.

## 🗂 Layout

A pnpm workspace. Two things deploy, to two different machines.

| Path | What | Runs on |
|---|---|---|
| `apps/web` | the site | ☁️ Cloudflare Workers |
| `apps/engine` | compiles and grades untrusted C++ | 🖥 a sandbox VM |
| `arrakis` | the server: OpenTofu, libvirt, host config | — |
| `docs` | the plan, the open work, the history | — |

Workers has no filesystem and no processes, so compiling someone's C++ can
never happen there. That split is why this is a workspace and not one package.

## 🛡 How the engine runs untrusted code

It doesn't invent a sandbox. [`isolate`](https://github.com/ioi/isolate) — what
the IOI grades on — does that, behind cgroups, namespaces and seccomp. The
engine compiles, calls it, and reads the result.

Every boundary is measured, not assumed:

| Attempt | Result |
|---|---|
| reach the internet | `Network is unreachable` |
| read the host's `/etc/shadow` | blocked |
| fork forever | stops at 63 children |
| allocate past 64 MB | OOM-killed |
| loop forever | killed at 2 s |

## 🌱 Your first contribution

Issues labelled [**good first issue**](https://github.com/msohail22/low-level-lab/labels/good%20first%20issue)
are one file each and need no knowledge of the codebase. `pnpm validate` tells
you if the format is wrong, so you cannot get it quietly wrong.

## 🤝 Contributing

**The fastest useful thing you can do is add one question.** No roles, no
approval queue — open a pull request and CI tells you if the format is wrong.

→ **[CONTRIBUTING.md](CONTRIBUTING.md)**

## 📄 License

[MIT](LICENSE) © Mohammed Sohail

Questions and answers are part of the repository, so they carry the same
licence as the code.
