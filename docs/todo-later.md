# Low Level Lab — todo later

Things agreed but not started. Nothing here is scheduled. Added 2026-11-09.
Last updated 2026-11-09 (T8 ported; T12 opened).

This file is the parking lot. `docs/plan.md` is what we decided to build;
this is what we decided to build *eventually*. An item leaves this file only
by moving into `plan.md` with a decision row behind it.

## 1. The site itself

| ID | Item | Notes |
|---|---|---|
| T1 | Customise the sign-in page | Today it is the stock WorkOS AuthKit screen. Needs the project's own name, wording and colours. Check what AuthKit lets us brand before deciding between theming it and self-hosting the form. |
| T2 | Sponsorship | Not designed. Open questions: who is being asked, what they get, and where it appears on the site without turning the question pages into advertising space. |
| T3 | Say on the site what remote execution will and will not be | Must be visible before anyone depends on it, not after. **This item is written from a half-caught sentence and needs confirming**: the intent was either "remote execution support will be dropped" or "a notice that it may be dropped". Do not build from it until it is settled. |

## 2. Running code

The large piece. It will take time, and that is accepted.

| ID | Item | Notes |
|---|---|---|
| T4 | A code execution engine | Build one or adopt a well-maintained one. Prefer adopting: a sandbox that runs other people's C++ is a security project, not a feature. Decide by reading what exists first. |
| T5 | Deploy it on arrakis | The engine does not run on Workers. arrakis is the machine it lands on. |
| T6 | Local running with near-zero config | The default path. A reader clones nothing and installs nothing beyond a compiler, and the question page tells them the one command. Friction here is the thing that decides whether anyone actually practises. |
| T7 | Remote running as the second path | For a reader with no toolchain. T6 must work without it; T7 must never become the only way to answer a question. |

## 3. Repositories

| ID | Item | Notes |
|---|---|---|
| ~~T8~~ | ~~Archive `~/Github/arrakis` and `~/Github/quarantine`~~ | **PORTED 2026-11-09.** Both repos are now in this one: engine → `apps/engine`, manifests → `infra/engine`, machine config → `infra/arrakis`, prose → `docs/arrakis/`. The site moved to `apps/web` and this became a pnpm workspace. **The archiving itself is not done** — it is a `gh repo archive` the agent does not run. Four paths were deliberately *not* ported, see T12. |
| T12 | Rotate the secrets arrakis committed, then archive | `tofu/k8s/terraform.tfstate` is tracked in arrakis and holds a plaintext `POSTGRES_PASSWORD` and Grafana `admin-password` (`random_password` results, written to state). `.terraform.tfstate.backup` holds the previous generation, and 81 MB of provider binaries are tracked beside them. Cause: `.gitignore` anchored `tofu/*.tfstate`, which never matched `tofu/k8s/`. Archiving does not remove them — a read of the archived repo still shows them. Rotate the passwords, then decide whether the repo is scrubbed or deleted. |
| T9 | Decide what `learning.md` becomes now that arrakis is ported | Copied to `docs/arrakis/learning.md` so nothing was lost, but the hard rule in `~/.claude/CLAUDE.md` still names `~/Github/arrakis` as its home, and that path is about to be archived. Either the rule's path changes to this repo, or the log is declared closed. Not decided, so nothing in the global rules was edited. |

## 4. Around the project

| ID | Item | Notes |
|---|---|---|
| T10 | Start posting on Twitter | Regular updates, not an announcement. The `daily-content` skill already drafts these. |
| T11 | Build a culture around solving problems to get things done | The actual goal the rest of this serves. No plan yet. It is a writing and community problem, not a code one, so it will not be solved by shipping features. |

## Open questions

- **T12 is the only urgent item in this file.** A committed password does not
  expire on its own and archiving does not hide it.
- T3's wording, as above. It is the only item here that cannot be started.
- T9: move the learning log here, or close it. Blocks nothing, but the global
  agent rule points at a path that is going away.
- T4: adopt or build. This decision gates T5, T7 and most of the timeline.
- T2: whether sponsorship arrives before or after there is an audience to
  sponsor. Doing it in the wrong order costs credibility that is hard to buy
  back.
