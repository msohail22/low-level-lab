# Community Questions + OpenFGA Design

**Date:** 2026-08-16  
**Status:** Approved for implementation  
**Repo:** `msohail22/low-level-lab`

## Goal

Community-authored C++ / low-level practice questions with **moderated** publishing. Any signed-in user can submit; **reviewers** (OpenFGA) approve/reject. Content lives in Postgres (fully normalized); authorization via **OpenFGA**.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Publish model | Moderated (`draft` → `pending` → `approved` / `rejected`) |
| Who submits | Any signed-in user |
| Who reviews | OpenFGA `reviewer` (or `admin`) on `platform:llb` |
| Question types (v1) | `mcq`, `true_false`, `multi_select`, `print_output`, `spot_bug` |
| Storage | Fully normalized tables (not JSON payload) |
| AuthZ | OpenFGA (no role column on `user`) |
| Local fallback | If FGA env missing: session required; reviewers from `REVIEWER_USER_IDS` comma list |

## Schema

- `topic` — catalog
- `question` — shared fields + type/status/author
- `question_option` — choices / line labels
- `question_answer` — correct option id(s) and/or boolean for T/F
- `question_review` — audit of approve/reject

## OpenFGA model (sketch)

```
type user

type platform
  relations
    define member: [user]
    define reviewer: [user] or admin
    define admin: [user]

type question
  relations
    define author: [user]
    define platform: [platform]
    define can_review: reviewer from platform
    define can_view_pending: author or can_review
```

## UI

- `/contribute/questions` — my questions
- `/contribute/questions/new` — create form
- `/review/questions` — pending queue (reviewers)

## API (REST v1; GraphQL later per to-do-later)

- Topics CRUD-lite (list + seed)
- Create / list mine / submit
- Review list / approve / reject
