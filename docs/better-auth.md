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
pnpm exec wrangler secret put GOOGLE_CLIENT_ID
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
pnpm exec wrangler secret put GITHUB_CLIENT_ID
pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
```

`BETTER_AUTH_SECRET` should be a long, random value. `BETTER_AUTH_URL` should
be the public origin of the deployed Worker, such as
`https://low-level-lab.example.workers.dev`.

For local development, provide the same names through the local Wrangler
environment without committing a `.dev.vars` file.

Configure each provider's OAuth callback URL as
`https://<your-origin>/api/auth/callback/google` and
`https://<your-origin>/api/auth/callback/github`.

## Database schema and migration

Better Auth's CLI is the source of truth for the Drizzle schema. The checked-in
`worker/db/schema.ts` file is generated application code, not a separately
invented auth model. Regenerate it after changing Better Auth options:

```sh
pnpm dlx auth@latest generate
```

Review the generated output before committing it, especially if table names,
plugins, or custom fields change.

Apply `worker/migrations/0000_better_auth.sql` to the PostgreSQL database
behind Hyperdrive before the first sign-up. The migration creates Better Auth's
`user`, `session`, `account`, and `verification` tables and uses
`CREATE TABLE IF NOT EXISTS` so rerunning it does not fail when those tables
already exist.

The migration is plain PostgreSQL SQL so it can be applied with the database's
normal migration tooling or a one-off administrative connection. Do not put
database credentials in this repository.

## Supported flow

The UI supports account creation, email/password sign-in, Google and GitHub
sign-in, session loading, sign-out, and requesting a password reset. Reset
links are queued through the existing Cloudflare Queue; a queue consumer or
email provider must deliver the queued message to the user. The reset form is
available at `/reset-password?token=...`.

The password reset API endpoints are provided by Better Auth:

- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
