-- notbadlah.com — unified D1 schema (all three lead types in one table)
-- Fresh setup: npx wrangler d1 execute notbadlah-db --remote --file=schema.sql
-- Existing DB with data: run migrations/0001_unify_leads.sql instead (see that file).

CREATE TABLE IF NOT EXISTS leads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT NOT NULL DEFAULT 'part_time',  -- client | part_time | full_time
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT NOT NULL,

  -- part_time fields
  occupation      TEXT DEFAULT '',
  hours_available TEXT DEFAULT '',

  -- full_time fields
  job_title       TEXT DEFAULT '',
  monthly_income  TEXT DEFAULT '',
  pathway         TEXT DEFAULT '',

  -- client fields
  interest        TEXT DEFAULT '',
  preferred_time  TEXT DEFAULT '',

  submitted_at    TEXT NOT NULL,
  contacted       INTEGER DEFAULT 0,
  notes           TEXT DEFAULT '',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_type      ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_submitted ON leads(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_contacted ON leads(contacted);
