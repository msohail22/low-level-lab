# OpenFGA setup

The workflow is:

```text
member submits → reviewer reviews → admin approves → super admin publishes
```

Any authenticated member can create and submit a question. Reviewers can
review assigned questions/topics. Admins approve questions in their assigned
topics. Only super admins publish, except that a super admin may create,
approve, and publish without review.

## Free deployment options

- OpenFGA Cloud has a free tier subject to its current limits.
- Self-hosting OpenFGA is free software, but still needs somewhere to run.
- The Cloudflare Worker is only the API client; it cannot be the OpenFGA
  service itself.

The authorization model is in `openfga/model.fga`. Create an OpenFGA store,
write this model, and copy these identifiers into Worker secrets/variables:

```text
OPENFGA_API_URL
OPENFGA_API_TOKEN
OPENFGA_STORE_ID
OPENFGA_MODEL_ID
```

Create a bootstrap organization tuple for the super admin:

```text
organization:low-level-lab#super_admin@user:<your-user-id>
```

Then add scoped assignments:

```text
organization:low-level-lab#admin@user:<admin-id>
organization:low-level-lab#reviewer@user:<reviewer-id>
organization:low-level-lab#member@user:<member-id>
topic:<topic-id>#admin@user:<admin-id>
topic:<topic-id>#reviewer@user:<reviewer-id>
question:<question-id>#author@user:<author-id>
question:<question-id>#topic@topic:<topic-id>
```

Obtain `<your-user-id>` from the Better Auth `user.id` value in the database
after creating the account. Do not use an email address as the OpenFGA user
identifier. Keep the API token in Wrangler secrets, never in source control.

The Worker authorization adapter fails closed when OpenFGA is not configured or
unavailable.
