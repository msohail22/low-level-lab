# Content authorization

Authorization is implemented through OpenFGA Cloud. The Worker is an HTTP
client and keeps all OpenFGA calls in `worker/authorization/openfga.ts`.

## Roles

- `super_admin`: unrestricted content and user-management access.
- `admin`: manages and approves content for assigned topics.
- `reviewer`: reviews questions for assigned topics.
- `member`: authenticated learner who can create and submit questions.

Assignments are OpenFGA tuples. The first super admin must be assigned:

```text
organization:low-level-lab#super_admin@user:<better-auth-user-id>
```

Never grant authorization based only on a client-provided role or email.
