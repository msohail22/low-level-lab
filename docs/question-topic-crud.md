# Question and Topic CRUD Foundation

This slice adds persisted CRUD APIs for topics and questions. It intentionally
stops before moderation, publication, social publishing, and code execution.

## Topic endpoints

- `GET /api/topics` - list non-archived topics.
- `GET /api/topics/:id` - read one topic.
- `POST /api/topics` - create a topic; requires an authenticated session.
- `PUT /api/topics/:id` - update a topic; requires an authenticated session.
- `DELETE /api/topics/:id` - archive a topic; requires an authenticated session.

## Question endpoints

- `GET /api/questions` - list draft questions.
- `GET /api/questions/:id` - read one question.
- `POST /api/questions` - create a draft; requires an authenticated session.
- `PUT /api/questions/:id` - update a draft; requires an authenticated session.
- `DELETE /api/questions/:id` - archive a question; requires an authenticated
  session.

Question writes validate the supported types, difficulty values, slugs, option
limits, and answer shape. Question records reference topics and authors.

## Current boundaries

- Mutations require a signed-in user but do not yet implement the planned role
  and moderation policy.
- Delete is implemented as archival to preserve content history.
- Only draft questions are returned by the collection endpoint.
- The management UI and moderation queue are the next application layer.
- Apply `worker/migrations/0001_question_topic_crud.sql` before using these
  endpoints against the configured database.
