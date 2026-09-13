# App Shell UI PR Checklist

This checklist tracks the UI-only first slice of Low Level Lab. It intentionally
does not include backend, authentication, persistence, or moderation work.

## Completed in this PR

- [x] Create an app shell with responsive sidebar navigation.
- [x] Add Dashboard, Questions, Topics, Progress, and Settings/sign-in entry points.
- [x] Add a browseable question list backed by local mock data.
- [x] Add search and question-type filtering.
- [x] Add a question detail view with selectable answers.
- [x] Add a UI-only answer submission state and explanation preview.
- [x] Add Mathematics and Artificial Intelligence topic examples.
- [x] Add a responsive mobile navigation drawer.
- [x] Add a light/dark theme toggle for the shell.
- [x] Add a draft content-management UI for questions and topics.
- [x] Reuse shared Zod validation in the content forms.
- [x] Add workflow-oriented sidebar entries for submissions, review, topics, and super-admin management.

## Still missing

- [x] Connect questions to the database and API.
- [ ] Add Better Auth and protected user sessions.
- [x] Persist answers, solved status, and progress.
- [x] Add server-side answer validation and real explanations.
- [x] Add topic detail pages and full pagination.
- [x] Add question creation, revisions, and moderation workflows.
- [x] Connect content-management forms to the authenticated CRUD API.
- [x] Add centralized database-backed role authorization.
- [ ] Add role-assignment management and bootstrap the first super-admin.
- [x] Add search indexing and production-scale filtering.
- [x] Add an explicit social-publishing boundary (provider integration remains unimplemented).
- [x] Add an explicit coding-execution boundary (sandbox execution remains unimplemented).

## PR verification

- [x] `pnpm lint`
- [x] `pnpm build`
- [ ] Review the shell at desktop and mobile widths.
