-- Progress and settings for a signed-in reader.
--
-- There is no users table on purpose. WorkOS stores identity — email, name,
-- avatar, which GitHub account — and the session cookie carries it, so a
-- profile page renders with no database read. A local users table would be a
-- cache that goes stale. D1 holds only what WorkOS does not have.
--
-- One row per fact, never a JSON blob per user. Marking a question solved is
-- then a single INSERT that cannot lose a concurrent write from another tab,
-- and the primary key makes clicking twice harmless.

CREATE TABLE IF NOT EXISTS progress (
  -- The WorkOS user id, e.g. "user_01HQ3...". Not an email: an email can
  -- change, and the id cannot.
  user_id TEXT NOT NULL,

  -- 'solved'  — key is "<topic>/<slug>", value is NULL
  -- 'setting' — key is the setting name, value is the setting value
  kind    TEXT NOT NULL CHECK (kind IN ('solved', 'setting')),

  key     TEXT NOT NULL,
  value   TEXT,

  -- Unix seconds. When it was solved, or when the setting last changed.
  at      INTEGER NOT NULL,

  PRIMARY KEY (user_id, kind, key)
);

-- The primary key already serves "everything for this user", which is what
-- every page needs. This index serves the other direction: how many people
-- solved a given question, for a future ranking job. Without it that is a
-- full table scan.
CREATE INDEX IF NOT EXISTS progress_by_key ON progress (kind, key);
