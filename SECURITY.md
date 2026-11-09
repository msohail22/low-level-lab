# 🔒 Security policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Use GitHub's [private vulnerability reporting](https://github.com/msohail22/low-level-lab/security/advisories/new),
which reaches the maintainer without disclosing anything. If that is
unavailable, email the maintainer instead.

Expect an acknowledgement within a few days. This is a personal project, not a
company with an on-call rota — if it matters and you hear nothing in a week,
chase it.

## What matters most here

This project compiles and runs **untrusted C++**. That is the whole attack
surface, and the parts worth your attention are:

| Area | What would be serious |
|---|---|
| `apps/engine` | anything that escapes the sandbox: reaching the network, reading the host filesystem, surviving the CPU or memory limit, seeing another box's files |
| `apps/engine` | a crafted request that runs code outside `isolate`, for example through the compile step |
| `apps/web` | leaking a session, or writing another reader's progress |
| `arrakis` | reaching the host or another VM from the sandbox VM |

The sandbox itself is [`isolate`](https://github.com/ioi/isolate), which is not
ours. **A flaw in isolate belongs upstream, not here.** What belongs here is a
flaw in how we *configure* or *call* it — a missing `--cg`, a limit that is not
applied, a path that escapes the box.

### Known and accepted

These are deliberate, documented decisions and not vulnerabilities:

- **Correct answers ship to the browser.** Choice options live in frontmatter,
  which is part of the page. Accepted for a practice site.
- **Questions and answers are public.** Everything except reader progress is
  readable without an account, by design.
- **`isolate` runs setuid root.** It is designed that way and requires it.
- **No high availability.** One server. If it stops, the engine stops.

If you think one of these is worse than we believe, say so. That argument is
worth having, and the reasoning behind each one is written down — ask and it
will be quoted back to you in full rather than paraphrased.

## Scope

The site, the engine, the validator, and the server configuration in `arrakis/`.
Out of scope: Cloudflare, WorkOS and GitHub themselves — report those to them.

## Disclosure

Report privately, then publish whatever you like once it is fixed. Credit is
yours and will be in the advisory unless you ask otherwise.
