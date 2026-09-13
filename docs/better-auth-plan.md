# Better Auth implementation plan

## Goal

Add a secure, first-party Better Auth integration to the React application
served by the Cloudflare Worker, while keeping the implementation compatible
with the existing Hyperdrive database binding.

## Scope

1. Configure Better Auth in the Worker with the project URL, a secret supplied
   through a Cloudflare secret, and a database adapter that uses the existing
   Hyperdrive connection.
2. Add the Better Auth schema and the database migration needed for users,
   sessions, accounts, and verification tokens.
3. Route `/api/auth/*` requests through Better Auth and preserve the existing
   Worker API behavior for other `/api/*` requests.
4. Add a typed browser auth client and a minimal sign-in/sign-up/session UI so
   the integration is usable from the current React app.
5. Document local setup, required secrets, database migration/deployment steps,
   supported auth flows, and security considerations.
6. Run the repository's lint, build, and Cloudflare dry-run checks before
   opening a pull request against `master`.

## Decisions and constraints

- Use email/password authentication for the initial integration; social
  providers can be added later without changing the core session model.
- Use the existing Hyperdrive binding rather than introducing a second
  persistence service.
- Keep secrets out of source control and `.dev.vars*`; document names and
  commands instead.
- Make the feature branch `feat/better-auth` from the current `master`.

## Delivery sequence

1. Create the feature branch and record this plan.
2. Implement server configuration, schema/migration, Worker routing, and the
   browser client/UI.
3. Add setup and API documentation under `docs/`.
4. Validate linting, type-checking/build output, and Wrangler dry-run output.
5. Commit the focused changes, push the branch, and open a PR targeting
   `master` with verification details.

## Acceptance criteria

- Auth requests under `/api/auth/*` are handled by Better Auth.
- Users can create an account, sign in, inspect the current session, and sign
  out through the UI.
- Auth data is persisted through the configured database adapter.
- No secret or local environment file is committed.
- The existing project checks pass, and the PR clearly identifies any
  deployment-time setup that cannot be performed locally.
