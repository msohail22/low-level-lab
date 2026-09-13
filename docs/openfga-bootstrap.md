# OpenFGA bootstrap

The checked-in model is `openfga/model.fga`. Bootstrap values are deliberately
parameterized: do not commit tokens, client secrets, store IDs, or user IDs.

1. Create an OpenFGA store and client credentials in the OpenFGA console.
2. Export `OPENFGA_API_URL`, `OPENFGA_STORE_ID`, `OPENFGA_MODEL_ID` (when
   already known), and an ephemeral `OPENFGA_BEARER_TOKEN` in your shell.
3. Validate the model with `fga model test --model-file openfga/model.fga`.
4. Run `OPENFGA_APPLY=0 ./scripts/openfga-bootstrap.sh` first. The script is
   dry-run by default; it never creates tuples in dry-run mode.
5. Use the super-admin UI or the API only after supplying an explicit user ID.

The API endpoint for role tuples is `/api/admin/roles`. It is protected by
`can_assign_roles` and validates a user ID, role, and optional topic. `POST`
adds one tuple and `DELETE` removes one tuple. No default users are seeded,
and no irreversible tuple writes are performed during deployment or local
development.
