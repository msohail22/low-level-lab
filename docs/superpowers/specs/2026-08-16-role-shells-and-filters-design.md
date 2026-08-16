# Role Shells + Question Filters Design

**Date:** 2026-08-16  
**Status:** Approved for implementation (A + B); C/D deferred to `docs/to-do-later.md`

## A — Role shells

- **Learner** — `/dashboard` hub: practice, contribute, leaderboard  
- **Reviewer** — `/review/*` only if OpenFGA `reviewer` (or `REVIEWER_USER_IDS`)  
- **Admin** — `/admin/*` only if OpenFGA `admin` (or `ADMIN_USER_IDS`); grant reviewers, high-level stats  

`GET /api/me` returns `{ user, roles: { reviewer, admin } }` for nav gating.

## B — Question filters

Query params on list endpoints:

| Surface | Filters |
|---------|---------|
| Learn topic questions | `type`, `difficulty`, `attempted` (`all`\|`yes`\|`no`) |
| My contributions | `type`, `status` |
| Review pending | `type`, `difficulty` |

## Deferred

- C: Realtime leaderboard Durable Object  
- D: GraphQL API  
