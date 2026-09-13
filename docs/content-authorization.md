# Content Authorization

OpenFGA is compatible with the Cloudflare Worker runtime because the Worker
can call the OpenFGA HTTP API with `fetch`; it does not require a Node-only
SDK or a long-lived server process.

The integration boundary is intentionally kept in one module:

```text
worker/authorization/openfga.ts
```

Controllers call `requireContentManager()` from the request utilities. They do
not construct OpenFGA requests, inspect tokens, or duplicate permission rules.

## Configuration

Configure these Worker secrets or variables when the OpenFGA store is ready:

- `OPENFGA_API_URL`
- `OPENFGA_API_TOKEN`
- `OPENFGA_STORE_ID`
- `OPENFGA_MODEL_ID`

Until the OpenFGA settings are configured, the adapter uses the authenticated
session as the development fallback. Production deployment must configure
OpenFGA before relying on content-management permissions.

The current permission is `manage_content` on `content:catalog`. Future
question ownership, moderator, editor, and publisher relations should be
added to this adapter and its model rather than implemented in controllers.
