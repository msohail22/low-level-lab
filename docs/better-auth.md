# Better Auth setup

The application uses Better Auth with email/password authentication. Auth
requests are handled by the Worker at `/api/auth/*`, and auth tables are
stored in the PostgreSQL database exposed by the `LOW_LEVEL_LAB_DB` Hyperdrive
binding.

## Required configuration

Set these Worker secrets before deploying:

```sh
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put BETTER_AUTH_URL
```

`BETTER_AUTH_SECRET` should be a long, random value. `BETTER_AUTH_URL` should
be the public origin of the deployed Worker, such as
`https://low-level-lab.example.workers.dev`.

For local development, provide the same names through the local Wrangler
environment without committing a `.dev.vars` file.

## Database migration

Apply `worker/migrations/0000_better_auth.sql` to the PostgreSQL database
behind Hyperdrive before the first sign-up. The migration creates Better Auth's
`user`, `session`, `account`, and `verification` tables.

The migration is plain PostgreSQL SQL so it can be applied with the database's
normal migration tooling or a one-off administrative connection. Do not put
database credentials in this repository.

## Supported flow

The initial UI supports account creation, email/password sign-in, session
loading, and sign-out. OAuth providers, email verification delivery, password
reset delivery, and rate limiting are intentionally left for a follow-up
configuration once the application's email and provider credentials exist.
