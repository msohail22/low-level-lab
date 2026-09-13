# Content authorization

Authorization is implemented through OpenFGA. The Worker is an HTTP client and
keeps all OpenFGA calls in `worker/authorization/openfga.ts`.

## Local development

Run an OpenFGA server on port 8080, create a local store, and write
`openfga/model.fga`. Then set the generated local store and model IDs in
`.dev.vars`:

```bash
docker run --rm -p 8080:8080 openfga/openfga run
fga store create --api-url http://127.0.0.1:8080
fga model write --api-url http://127.0.0.1:8080 --store-id <local-store-id> openfga/model.fga
```

Use `OPENFGA_AUTH_MODE=local` locally. Local mode omits OAuth credentials and
calls the OpenFGA HTTP API directly. Cloud mode is the deployment default and
uses the client-credentials secret.

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
