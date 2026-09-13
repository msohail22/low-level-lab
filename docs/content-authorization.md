# Content authorization

Authorization is implemented inside the Worker with database-backed roles. It
does not require a separately deployed authorization service.

## Roles

- `super_admin`: unrestricted content and user-management access.
- `admin`: manages and approves content for assigned topics.
- `reviewer`: reviews questions for assigned topics.
- `member`: authenticated learner who can create and submit questions.

Assignments are stored in `user_role`. A null `topic_id` is an
organization-wide assignment; a topic ID scopes an admin or reviewer to that
topic. Permission checks are centralized in
`worker/authorization/authorization.ts`.

The first super admin must be inserted through a controlled database operation:

```sql
INSERT INTO user_role (id, user_id, role)
VALUES ('role_<user-id>', '<better-auth-user-id>', 'super_admin');
```

Never grant authorization based only on a client-provided role or email.
