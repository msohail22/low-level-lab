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

## Still missing

- [ ] Connect questions to the database and API.
- [ ] Add Better Auth and protected user sessions.
- [ ] Persist answers, solved status, and progress.
- [ ] Add server-side answer validation and real explanations.
- [ ] Add topic detail pages and full pagination.
- [ ] Add question creation, revisions, and moderation workflows.
- [ ] Add OpenFGA authorization.
- [ ] Add search indexing and production-scale filtering.
- [ ] Add social publishing and operational observability.
- [ ] Design and sandbox coding-question execution.

## PR verification

- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Review the shell at desktop and mobile widths.
