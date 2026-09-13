# Content Management UI

This slice adds the first UI surface for managing question and topic drafts.

## Included

- A `Manage content` navigation entry at `/manage`.
- Separate Questions and Topics tabs.
- Draft list previews for both resources.
- Topic creation form.
- Question creation form covering the supported question types.
- Client-side validation using the shared `@low-level-lab/shared/content`
  schemas.
- Archive and delete affordances for the draft list.
- Menu-triggered edit modals for topic and question drafts.

## Deliberate boundary

The forms currently save into the local preview state and display a notice
that API persistence is the next slice. This keeps the UI reviewable without
requiring a signed-in session or a live database. The follow-up should add a
shared typed API client, load topics/questions from the Worker endpoints, and
connect create/update/archive actions to the authenticated CRUD API.
