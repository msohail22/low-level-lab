# Low Level Lab Feature Checklist

This is the current product checklist for Low Level Lab. It separates
implemented functionality from intentionally deferred work. It is a product
inventory, not a promise that every production operation has been configured
in an external provider.

## Product foundation

- [x] React and TypeScript application shell.
- [x] Vite client build.
- [x] Cloudflare Worker entrypoint.
- [x] Cloudflare static asset serving.
- [x] Shared pnpm workspace package.
- [x] Shared Zod request contracts.
- [x] Shared inferred TypeScript types.
- [x] Shared question type definitions.
- [x] Shared difficulty definitions.
- [x] Shared workflow status definitions.
- [x] Shared pagination and search contracts.
- [x] Shared answer submission contracts.
- [x] Shared workflow transition contracts.
- [x] Shared role-assignment contracts.
- [x] Controller/service/repository backend layering.
- [x] Separate authentication and content database schemas.
- [x] Centralized request parsing and JSON responses.
- [x] Centralized ID generation.
- [x] Routes kept in `src/App.tsx`.

## Authentication and accounts

- [x] Better Auth integration.
- [x] Email and password sign-up.
- [x] Email and password sign-in.
- [x] Email verification flow.
- [x] Password reset request flow.
- [x] Password reset completion flow.
- [x] Google sign-in configuration support.
- [x] GitHub sign-in configuration support.
- [x] Auth session lookup in Worker requests.
- [x] Auth email delivery through the Cloudflare queue.
- [x] Resend email integration.
- [x] Protected authenticated mutations.
- [x] Unauthorized response handling.
- [ ] Profile editing UI.
- [ ] Account deletion flow.
- [ ] Session/device management UI.

## Application navigation and layout

- [x] Responsive application layout.
- [x] Desktop sidebar.
- [x] Mobile navigation drawer.
- [x] Top bar.
- [x] Dashboard navigation.
- [x] Questions navigation.
- [x] Topics navigation.
- [x] Progress navigation.
- [x] Content-management navigation.
- [x] Submit-question navigation entry.
- [x] Review-question navigation entry.
- [x] Topic-management navigation entry.
- [x] Super-admin navigation entry.
- [x] Light theme.
- [x] Dark theme.
- [x] Responsive layout styling.
- [x] Empty-state presentation.
- [x] Loading-state presentation.
- [x] Error-state presentation.
- [x] Unauthorized-state presentation.

## Dashboard

- [x] Dashboard route.
- [x] Authenticated dashboard data loading.
- [x] Total question count.
- [x] Solved question count.
- [x] Topic progress summary.
- [x] Recent activity summary.
- [x] Dashboard loading state.
- [x] Dashboard error state.
- [x] Dashboard empty state.
- [x] Links to questions and topics.
- [ ] Advanced analytics.
- [ ] Request-origin analytics.
- [ ] Admin operational dashboard.

## Question browsing

- [x] Questions route.
- [x] API-backed question listing.
- [x] Published-question visibility rules.
- [x] Management-mode question listing.
- [x] Search by question text.
- [x] Search by title.
- [x] Search by body.
- [x] Search by slug.
- [x] Filter by question type.
- [x] Filter by difficulty.
- [x] Filter by topic.
- [x] Filter by workflow status for management users.
- [x] Sort/order support.
- [x] Server-side pagination.
- [x] Client pagination controls.
- [x] Loading state.
- [x] Error state.
- [x] Empty state.
- [x] Question-row component.
- [x] Question detail links.
- [x] Removal of remaining question-list mock usage.
- [ ] Saved searches.
- [ ] Personalized recommendations.

## Question detail and answering

- [x] Question detail route.
- [x] Published-question access restriction.
- [x] Question metadata display.
- [x] Topic display.
- [x] Difficulty display.
- [x] Question type display.
- [x] Single-choice answer input.
- [x] Multiple-choice answer input.
- [x] True/false answer input.
- [x] Math answer input.
- [x] AI answer input.
- [x] Code-output question display boundary.
- [x] Answer submission API.
- [x] Server-side answer validation.
- [x] Correct/incorrect result.
- [x] Explanation display.
- [x] Solved-status update.
- [x] Attempt persistence.
- [x] Retry support.
- [x] Question detail loading state.
- [x] Question detail error state.
- [x] Question detail empty/not-found state.
- [x] Markdown content rendering.
- [x] Inline math rendering boundary.
- [x] Safe HTML escaping for rendered content.
- [ ] Rich syntax highlighting for every language.
- [ ] Interactive equation editor.

## Topics

- [x] Topics route.
- [x] API-backed topic listing.
- [x] Topic name and slug display.
- [x] Topic question counts.
- [x] Topic detail route.
- [x] Topic detail question listing.
- [x] Topic detail pagination.
- [x] Topic loading state.
- [x] Topic error state.
- [x] Topic empty state.
- [x] Topic not-found state.
- [x] Mathematics topic support.
- [x] Artificial Intelligence topic support.
- [x] Subtopic field support.
- [ ] Nested topic hierarchy.
- [ ] Topic subscriptions.
- [ ] Topic-specific learner recommendations.

## Content creation and management

- [x] Content-management route.
- [x] Topic creation form.
- [x] Question creation form.
- [x] Shared Zod validation in forms.
- [x] API-backed topic creation.
- [x] API-backed question creation.
- [x] Topic edit form.
- [x] Question edit form.
- [x] Topic archive action.
- [x] Question archive action.
- [x] Draft content listing.
- [x] Content management loading state.
- [x] Content management error state.
- [x] Content management empty state.
- [x] Invalid-input feedback.
- [x] Slug validation.
- [x] Question-type validation.
- [x] Option validation.
- [x] Correct-answer validation.
- [x] Explanation field.
- [x] Math-question fields.
- [x] AI-question fields.
- [x] Author ownership checks.
- [x] Published-question edit reset behavior.
- [ ] Bulk import.
- [ ] Bulk export.
- [ ] Draft autosave.

## Question workflow and moderation

- [x] Draft status.
- [x] Submitted status.
- [x] In-review status.
- [x] Approved status.
- [x] Published status.
- [x] Changes-requested status.
- [x] Rejected status.
- [x] Archived status.
- [x] Submit transition.
- [x] Start-review transition.
- [x] Request-changes transition.
- [x] Reject transition.
- [x] Approve transition.
- [x] Publish transition.
- [x] Server-side transition validation.
- [x] Invalid-transition rejection.
- [x] Transition reason support.
- [x] Workflow event persistence.
- [x] Reviewer moderation queue.
- [x] Admin approval queue.
- [x] Super-admin publishing controls.
- [x] Workflow action buttons.
- [x] Workflow loading states.
- [x] Workflow errors.
- [x] Workflow unauthorized states.
- [x] Moderation empty states.
- [x] Moderation question previews.
- [x] Moderation status filters.
- [ ] Reviewer assignment workload balancing.
- [ ] Moderation bulk actions.

## Revisions and history

- [x] Immutable question revision records.
- [x] Revision number tracking.
- [x] Content hash tracking.
- [x] Revision author tracking.
- [x] Revision timestamps.
- [x] Revision listing endpoint.
- [x] Revision listing UI.
- [x] Revision comparison view.
- [x] Revision restoration endpoint.
- [x] Revision restoration UI.
- [x] Restored revision creates a new revision.
- [x] Revision authorization checks.
- [x] Workflow event history.
- [ ] Side-by-side rich diff for complex formatted content.
- [ ] Permanent revision deletion policy.

## OpenFGA authorization

- [x] OpenFGA Cloud configuration support.
- [x] Regional OpenFGA API URL support.
- [x] OpenFGA store ID configuration.
- [x] OpenFGA authorization model ID configuration.
- [x] OAuth client-credentials flow.
- [x] OpenFGA access-token caching.
- [x] Local OpenFGA mode.
- [x] Local direct HTTP mode without OAuth.
- [x] Centralized OpenFGA adapter.
- [x] Fail-closed behavior.
- [x] Better Auth user IDs as OpenFGA subjects.
- [x] Organization-level super-admin relation.
- [x] Organization-level admin relation.
- [x] Organization-level reviewer relation.
- [x] Organization-level member relation.
- [x] Topic-scoped admin relation.
- [x] Topic-scoped reviewer relation.
- [x] Question author relation.
- [x] Topic-to-question relation.
- [x] Organization-to-question relation.
- [x] Create-question permission.
- [x] Edit-question permission.
- [x] Submit-question permission.
- [x] Review-question permission.
- [x] Approve-question permission.
- [x] Publish-question permission.
- [x] Topic-management permission.
- [x] User-management permission.
- [x] OpenFGA model source in `openfga/model.fga`.
- [x] Parameterized bootstrap script.
- [x] Dry-run bootstrap behavior.
- [x] Explicit tuple-write opt-in.
- [x] Super-admin role-assignment UI.
- [x] Role-assignment endpoint.
- [x] Role-assignment deletion endpoint.
- [x] Topic-scoped assignment UI.
- [x] Role-assignment validation.
- [ ] External store/model/tuple bootstrap completed for every environment.
- [ ] Automated tuple reconciliation.

## Learner progress and history

- [x] Answer attempt persistence.
- [x] Correctness persistence.
- [x] Solved-question persistence.
- [x] Attempt count.
- [x] Last-attempt timestamp.
- [x] Solved-at timestamp.
- [x] Progress endpoint.
- [x] Progress page.
- [x] Per-topic progress.
- [x] Total solved count.
- [x] Question history endpoint.
- [x] Question history UI.
- [x] Correct/incorrect history display.
- [x] Attempt timestamps.
- [x] Progress loading state.
- [x] Progress error state.
- [x] Progress empty state.
- [x] Recently attempted content.
- [x] Retry from history.
- [ ] Streaks.
- [ ] Leaderboards.
- [ ] Badges.

## Database and persistence

- [x] Better Auth tables.
- [x] Topic table.
- [x] Question table.
- [x] Question workflow timestamps.
- [x] Question revision table.
- [x] Workflow event table.
- [x] Answer-attempt table.
- [x] Question-progress table.
- [x] Search indexes.
- [x] Workflow status index.
- [x] Topic/question indexes.
- [x] Migration sequence through current feature set.
- [x] Archive-on-delete behavior.
- [x] Foreign-key relationships.
- [x] Unique topic names and slugs.
- [x] Unique question slugs.
- [ ] Production migration execution verification.
- [ ] Backup and restore procedure.

## API surface

- [x] Authentication API.
- [x] Topic list endpoint.
- [x] Topic detail endpoint.
- [x] Topic create endpoint.
- [x] Topic update endpoint.
- [x] Topic archive endpoint.
- [x] Question list endpoint.
- [x] Question detail endpoint.
- [x] Question create endpoint.
- [x] Question update endpoint.
- [x] Question archive endpoint.
- [x] Question answer endpoint.
- [x] Question workflow endpoints.
- [x] Question revision endpoints.
- [x] Question restore endpoint.
- [x] Progress endpoint.
- [x] Question history endpoint.
- [x] OpenFGA role-assignment endpoints.
- [x] Moderation queue endpoints.
- [x] Shared request validation.
- [x] Shared response shapes.
- [x] HTTP error responses.
- [x] Authentication checks.
- [x] Authorization checks.
- [ ] Formal OpenAPI document.
- [ ] API rate limiting.

## Deployment and configuration

- [x] Wrangler configuration.
- [x] Worker build.
- [x] Client build.
- [x] Worker dry-run deployment validation.
- [x] Cloudflare KV binding.
- [x] Cloudflare Hyperdrive binding.
- [x] Cloudflare Queue binding.
- [x] Worker secret configuration.
- [x] OpenFGA Cloud variables.
- [x] OpenFGA local variables.
- [x] Environment type declarations.
- [x] Local `.dev.vars` support.
- [ ] Production OpenFGA bootstrap verification.
- [ ] Production database migration verification.
- [ ] End-to-end deployed smoke test.

## Intentional deferrals

- [ ] Social publishing provider integrations.
- [ ] Social publishing queue and retry policy.
- [ ] Secure coding-question execution.
- [ ] Sandboxed runtimes.
- [ ] Advanced analytics and request-origin reporting.
- [ ] Third-party tracking or behavioral data collection.
- [ ] Gamification.
- [ ] Leaderboards.

## Validation checklist

- [x] `pnpm lint`
- [x] `pnpm build`
- [x] `git diff --check`
- [x] Worker dry-run validation.
- [ ] Browser review at desktop width.
- [ ] Browser review at mobile width.
- [ ] End-to-end authentication test.
- [ ] End-to-end question-answer test.
- [ ] End-to-end moderation test.
- [ ] End-to-end OpenFGA permission test.
- [ ] End-to-end revision restoration test.

## Product conclusion

The implemented feature set is sufficient for a lean question-learning and
moderation product. The site does not need to collect additional behavioral
data to operate. Advanced analytics can be added later as a separate,
privacy-conscious feature, preferably using aggregate operational metrics
rather than user-level tracking.
