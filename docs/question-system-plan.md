# Low Level Lab - Product and Question System Scope

This document defines the product scope and planning decisions for Low Level
Lab before implementation begins. It is intentionally a product and
architecture plan, not an implementation specification.

## Product direction

Low Level Lab is a focused learning platform for programming, systems, and
computer science questions. The experience should be practical and
informational rather than gamified:

- users browse questions by topic, type, and status;
- users answer questions and receive explanations;
- progress is tracked per question and topic;
- question content can be moderated before publication;
- coding questions remain visible in the product but are explicitly
  under-development for the first release.

Avoid adding points, streaks, leaderboards, badges, or other gamification
unless that decision is made separately.

## Question types

The first release should support these question types:

1. **Single Choice (MCQ)** - one correct option from a list.
2. **Multiple Choice** - one or more correct options from a list.
3. **True / False** - a binary choice.
4. **Code Output** - the user enters the output produced by a code sample.
5. **Math Questions** - questions covering mathematical concepts, calculations,
   proofs, and problem-solving, with support for mathematical notation and
   step-by-step explanations.
6. **AI Questions** - questions covering artificial intelligence, machine
   learning, and related concepts, including model behavior and practical
   applications.
7. **Coding Questions (Coming Soon)** - a visible placeholder only; no
   execution environment or submission workflow in the first release.

Every implemented question type should share the same interaction model:

- topic and difficulty at the top;
- question content in the center;
- answer interaction below the content;
- submit action;
- explanation after submission;
- automatic solved status when the answer is correct, subject to the final
  progress policy.

Question content should support formatted text, code blocks, and language
metadata, as well as mathematical notation for math and AI-related content.
The answer format and validation rules must be type-specific and validated
server-side. Math questions should support numeric, symbolic, multiple-choice,
and step-by-step answers where appropriate.

## Application screens

### 1. Dashboard

Purpose: provide a useful overview without unnecessary gamification.

Planned content:

- welcome message;
- total questions available;
- total questions solved;
- topic progress, for example `12 / 30`;
- recently accessed questions;
- navigation to Dashboard, Questions, Topics, Progress, and Settings.

### 2. Questions page

This is the primary browsing screen.

Planned content and behavior:

- search input;
- topic filter;
- subtopic filter when applicable;
- question type filter;
- status filter: All, Solved, or Unsolved;
- paginated question list;
- question title, topic, subtopic, type, difficulty, and solved indicator;
- result count;
- selecting a question opens its detail page;
- coding questions appear as a clearly marked Coming Soon entry or section.

The list must be designed for thousands of questions. Do not load the entire
question bank into the browser to search or filter it.

### 3. Topics page

The Topics page is an overview of the available learning areas.

Each topic card should show:

- topic name;
- total question count;
- solved question count;
- optional short description.

Initial topic examples include JavaScript, TypeScript, C, C++, Networking,
Linux, Mathematics, Artificial Intelligence, and Machine Learning. The final
initial topic list remains a product decision.

Selecting a topic opens its Topic Detail page.

### 4. Topic Detail page

The Topic Detail page should show:

- topic name and description;
- total questions and solved questions;
- subtopics;
- question counts per subtopic;
- a View All Questions action scoped to the topic.

Example C subtopics include Pointers, Memory Management, Processes,
Compilation, and Data Structures.

### 5. Question Detail page

This is the main learning experience.

Before submission:

- back navigation to Questions;
- topic, subtopic, and difficulty metadata;
- question text and code sample;
- type-appropriate answer control;
- Submit Answer action.

After submission:

- Correct or Incorrect result;
- explanation;
- related topics;
- previous and next question navigation;
- solved state when the answer satisfies the selected progress policy.

The page should preserve the submitted answer and make the result clear. A
user must not be able to mark a question solved without going through the
answer flow unless that behavior is intentionally added later.

### 6. Progress page

The Progress page is purely informational.

Planned content:

- overall solved count, such as `42 / 150`;
- topic-by-topic solved and total counts;
- simple progress indicators;
- no competitive ranking or reward mechanics.

The definition of "solved" must be consistent across the Dashboard,
Questions page, Topic pages, and Progress page.

### 7. Coding Questions page

Coding Questions should remain visible in navigation and in the question
type model, but the first release should display a Coming Soon state:

- Coding Questions heading;
- clear under-development label;
- explanation that a proper environment for programming and systems-level
  problems is being built;
- no editor, runner, test execution, or code submission yet.

## Navigation and information architecture

```text
Low Level Lab
|
|- Dashboard
|
|- Questions
|  |- All Questions
|  |- Search and Filters
|  |- Question Detail
|  |- Coding Questions (Coming Soon)
|
|- Topics
|  |- Topic List
|  |- Topic Detail
|
|- Progress
|
|- Settings
```

The navigation should make Questions and Topics easy to reach. Question Detail
should preserve enough context to return to the previous list and filters.

## Search and filtering architecture

The initial search solution should not be over-engineered. Use PostgreSQL
native search and indexed filters first.

### Search scope

Search should cover:

- question title;
- description or body;
- tags;
- topic;
- subtopic.

### Recommended implementation direction

Use PostgreSQL full-text search as the primary mechanism:

```sql
to_tsvector('english', title || ' ' || description)
```

Combine it with trigram search using `pg_trgm` for partial and typo-tolerant
matching, such as `memory alloc` matching `memory allocation`.

Add indexes for the searchable document and common filters. Apply filters and
pagination in the database query rather than after fetching results.

```text
User Search
    |
Debounced API Request
    |
PostgreSQL Search Query
    |
Topic, Subtopic, Type, and Status Filters
    |
Paginated Results
```

The client should debounce search requests, show loading and empty states, and
preserve the current search and filter state during navigation where practical.
Use a dedicated search engine such as Typesense, Meilisearch, or Elasticsearch
only when scale or relevance requirements justify the operational complexity.

## Question data model direction

The first schema should support:

- stable ID, title, body, slug, author, and timestamps;
- question type;
- topic, subtopic, tags, difficulty, and language;
- structured answer/options data;
- explanation and optional references;
- visibility and publication time;
- revision number and content hash;
- moderation status;
- rejection or change-request reason;
- immutable audit history.

Store structured question content separately from presentation metadata so
additional question types do not require unsafe assumptions about arbitrary
JSON. Validate every submission server-side and sanitize rendered rich text.

The progress model should associate a user with a question attempt/result and
record enough information to support solved status, retry behavior, and
future progress reporting without changing the question itself.

## Content lifecycle and moderation

Use explicit states rather than a boolean published flag:

`draft` -> `submitted` -> `in_review` -> `approved` -> `scheduled` ->
`published`

Any review state can transition to `changes_requested` or `rejected`. A
published question can transition to `archived`; published content should not
be silently edited.

Every transition should record the actor, timestamp, previous state, new
state, reason, and optional moderation notes in an immutable audit log.

### Roles and authorization

Use relationship-based authorization, with application-level validation for
state transitions:

- `super_admin`: manage everything and publish directly;
- `admin`: manage configuration and moderate all questions;
- `moderator`: review, approve, reject, and request changes;
- `editor`: edit assigned or approved content, but cannot publish unless
  explicitly granted;
- `author`: create and edit their own drafts and respond to feedback;
- `viewer`: read published questions.

Database-backed role assignments are the proposed authorization system. Define
centralized permission checks for ownership,
assignment, organization/project scope, and moderation authority. Never treat
a client-side role or hidden UI control as authorization.

Policy defaults:

- authors can submit but cannot approve their own questions;
- approval and publication are separate permissions;
- require two-person review for high-risk or externally visible categories;
- allow `super_admin` to publish directly with an audit entry;
- do not delete submitted, approved, or published records; archive them.

## Social publishing

Social publishing is secondary to the learning product and should not block
question creation or answering.

On a `published` transition, create an outbox event containing the question ID,
revision, destination, and idempotency key. A queue consumer should:

1. load the immutable published revision;
2. render channel-specific text and media;
3. call configured provider APIs for X/Twitter and Instagram;
4. persist provider post IDs, status, attempts, and error details;
5. retry transient failures with backoff and dead-letter permanent failures.

Social channels must be opt-in per question or category, with preview,
approval, scheduling, rate limits, duplicate protection, and an operator
retry/cancel action. Provider tokens belong in Wrangler secrets.

## Suggested implementation phases

These are implementation phases for later; this document does not authorize
starting them yet.

1. Finalize product decisions and the first question bank shape.
2. Build the read-only shell: navigation, Dashboard, Questions, Topics,
   Topic Detail, Progress, and the Coding Questions placeholder.
3. Add question detail rendering for Single Choice, Multiple Choice,
   True / False, Code Output, Math, and AI questions.
4. Add answer submission, explanations, solved state, and progress tracking.
5. Add question search, filtering, pagination, and database indexes.
6. Add question creation, drafts, server-side validation, and moderation queue.
7. Add role assignments, authorization middleware, review actions, and
   immutable audit history.
8. Add approval, publication, scheduling, and revision handling.
9. Add asynchronous social publishing and operational observability.
10. Design and implement Coding Questions only after the execution model,
    sandboxing, resource limits, and security model are decided.

## Decisions to make before implementation

### Product decisions

- What is the final initial topic and subtopic list?
- Which difficulty levels are required?
- Is Code Output answer matching exact, normalized, or manually reviewed?
- For Multiple Choice, must all correct options be selected with no incorrect
  options?
- Can users retry a question, and does a later incorrect answer affect solved
  status?
- Is a question solved only after a correct answer, or after an explanation is
  viewed as well?
- Should users see the correct answer immediately after an incorrect attempt?
- Should question ordering be fixed, random, or configurable?
- What should Settings contain in the first release?

### Content and moderation decisions

- Which question types are required for the first release? (Current proposal:
  the four original implemented types plus Math and AI questions.)
- Which math notation format should be supported, such as LaTeX or Markdown
  extensions?
- Which math answer types should be supported first: numeric, symbolic,
  multiple-choice, or step-by-step?
- Should AI questions be treated as a topic/category, a separate question
  type, or both?
- Is review global, per organization, or per category?
- Which categories require two-person approval?
- Should authors be allowed to edit after feedback without resubmitting?
- What content and image policy governs public questions?
- What retention and deletion policy applies to rejected submissions?

### Search decisions

- Which language configuration should PostgreSQL full-text search use?
- Which fields should receive higher relevance weight?
- How much typo tolerance is useful before results become noisy?
- What pagination size and maximum page depth should be supported?
- Which query and result metrics will determine when a dedicated search engine
  is justified?

### Publishing decisions

- Which X/Twitter and Instagram accounts are official publishing targets?
- Should publishing be immediate, scheduled, or both?
- Which question categories may be published socially?
- Who approves social copy and media?

## Operational and security requirements

- Use idempotency keys for state transitions and social posts.
- Add optimistic concurrency using revision numbers.
- Rate-limit anonymous submissions and sign-in-protected mutations.
- Add spam and abuse controls, content length limits, and moderation flags.
- Keep audit logs append-only and redact secrets or personal data.
- Add structured logs, queue metrics, alerting, and dead-letter handling.
- Back up the database and define retention for rejected and archived content.
- Use separate preview credentials for OAuth, authorization, database, and
  social integrations.
- Never publish an unapproved revision, even if an older revision was
  approved.
- Treat future coding-question execution as a sandboxing and security project,
  not as a normal feature toggle.

## First-release acceptance criteria

- Users can browse the Dashboard, Questions, Topics, Topic Detail, Progress,
  and Coding Questions placeholder screens.
- Users can search and filter questions without loading the full question bank
  into the browser.
- Single Choice, Multiple Choice, True / False, Code Output, Math, and AI
  questions
  render with consistent interactions.
- Submitted answers produce a clear result and explanation.
- Solved status is reflected consistently across all progress surfaces.
- Coding Questions is visible but cannot execute or submit code.
- A user can submit a validated question without gaining publication rights.
- Authorization checks protect every moderation and publication mutation.
- A question cannot become public without the required approval policy.
- Every workflow transition is auditable and idempotent.
- Social publishing is asynchronous, opt-in, retryable, and never bypasses
  moderation.
