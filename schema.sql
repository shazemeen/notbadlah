-- notbadlah.com D1 database schema
-- Run once after creating the D1 database: npx wrangler d1 execute notbadlah-db --file=schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  occupation  TEXT DEFAULT '',
  hours_available TEXT DEFAULT '',
  submitted_at TEXT NOT NULL,
  contacted   INTEGER DEFAULT 0,
  notes       TEXT DEFAULT '',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_submitted ON leads(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_contacted ON leads(contacted);
