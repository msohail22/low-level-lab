# Question system implementation plan

## Goal

Build a moderated question platform where anyone can submit questions, trusted
roles can review them, and only authorized users can publish approved content.
Publishing should optionally create announcements for configured social
channels without allowing external integrations to bypass moderation.

## Proposed lifecycle

Use explicit states rather than a boolean published flag:

`draft` -> `submitted` -> `in_review` -> `approved` -> `scheduled` ->
`published`

Any review state can transition to `changes_requested` or `rejected`. A
published question can transition to `archived`; published content should not
be silently edited.

Every transition should record the actor, timestamp, previous state, new state,
reason, and optional moderation notes in an immutable audit log.

## Question model

The first schema should support:

- stable ID, title, body, slug, author, and timestamps;
- question type, such as `single_choice`, `multiple_choice`, `short_answer`,
  `long_answer`, `true_false`, or `code`;
- answer/options data validated against the question type;
- tags, categories, difficulty, language, and optional references;
- visibility, publication time, revision number, and content hash;
- moderation status, rejection/change-request reason, and audit history.

Store structured question content separately from presentation metadata so new
question types do not require unsafe JSON assumptions throughout the app.
Validate all submissions server-side and sanitize rendered rich text.

## Roles and OpenFGA authorization

Use OpenFGA for relationship-based authorization, with application-level
validation for state transitions:

- `super_admin`: manage everything and publish directly;
- `admin`: manage configuration and moderate all questions;
- `moderator`: review, approve, reject, and request changes;
- `editor`: edit assigned or approved content, but cannot publish unless
  explicitly granted;
- `author`: create and edit their own drafts and respond to feedback;
- `viewer`: read published questions.

Define relations for ownership, assignment, organization/project scope, and
moderation authority. Never treat a client-side role or hidden UI button as
authorization. Every command and transition must check OpenFGA server-side and
then enforce the workflow policy.

Recommended policy:

- authors can submit but cannot approve their own questions;
- approval and publication are separate permissions;
- require two-person review for high-risk or externally visible categories;
- allow `super_admin` to publish directly with an audit entry;
- prevent deleting submitted, approved, or published records; archive instead.

## Social publishing

Do not post directly inside the question creation request. On the
`published` transition, create an outbox event containing the question ID,
revision, destination, and idempotency key. A queue consumer should:

1. load the immutable published revision;
2. render channel-specific text and media;
3. call configured provider APIs for X/Twitter and Instagram;
4. persist provider post IDs, status, attempts, and error details;
5. retry transient failures with backoff and dead-letter permanent failures.

Social channels must be opt-in per question or category, with preview,
approval, scheduling, rate limits, duplicate protection, and an operator
retry/cancel action. Provider tokens belong in Wrangler secrets.

## API and UI slices

Implement in stages:

1. question creation, draft editing, and server-side validation;
2. submission and moderation queue;
3. OpenFGA model, relationship writes, and authorization middleware;
4. review actions and immutable audit history;
5. approval/publication and scheduled publishing;
6. outbox/queue delivery and social provider adapters;
7. author feedback, revision comparison, and publishing observability.

Keep route handlers thin. Put authorization and workflow commands in services,
validation in schemas, and UI in pages/components/hooks following the existing
project structure.

## Operational and security requirements

- Use idempotency keys for state transitions and social posts.
- Add optimistic concurrency using revision numbers.
- Rate-limit anonymous submissions and sign-in-protected mutations.
- Add spam/abuse controls, content length limits, and moderation flags.
- Keep audit logs append-only and redact secrets or personal data.
- Add structured logs, queue metrics, alerting, and dead-letter handling.
- Back up the database and define retention for rejected/archived content.
- Add preview environments with separate OAuth, OpenFGA, database, and social
  credentials.
- Never publish unapproved revisions, even if an older revision was approved.

## Decisions needed before implementation

- Which question types are required for the first release?
- Is review global, per organization, or per category?
- Which categories require two-person approval?
- Should authors be allowed to edit after feedback without resubmitting?
- Which X/Twitter and Instagram accounts are official publishing targets?
- Should publishing be immediate, scheduled, or both?
- What content and image policy governs public questions?
- What retention and deletion policy applies to rejected submissions?

## Acceptance criteria for the first implementation

- A user can submit a validated question without gaining publication rights.
- OpenFGA checks protect every moderation and publication mutation.
- Unauthorized users receive explicit errors, not silent success.
- A question cannot become public without the required approval policy.
- Every workflow transition is auditable and idempotent.
- Social publishing is asynchronous, opt-in, retryable, and never bypasses
  moderation.
- The system exposes enough status and error information for operators to
  resolve failed reviews and provider deliveries.
