-- Migration 0001 — unify the leads table for all three audiences.
--
-- The existing production `leads` table only has the original part-time
-- columns (name, phone, email, occupation, hours_available, submitted_at,
-- contacted, notes, created_at). This migration ADDS the new columns
-- WITHOUT dropping the table, so existing lead data is preserved.
--
-- BEFORE running this, export a backup (see Prompt 0 / project notes):
--   npx wrangler login
--   npx wrangler d1 export notbadlah-db --remote --output=backup-notbadlah-leads.sql
--
-- Then apply to the live DB:
--   npx wrangler d1 execute notbadlah-db --remote --file=migrations/0001_unify_leads.sql
--
-- SQLite ALTER TABLE ADD COLUMN can't add a NOT NULL column without a default,
-- so `type` is added with a default of 'part_time' (correct for all existing
-- rows, which came from the old part-time form). New inserts always set type
-- explicitly.

ALTER TABLE leads ADD COLUMN type           TEXT NOT NULL DEFAULT 'part_time';
ALTER TABLE leads ADD COLUMN job_title      TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN monthly_income TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN pathway        TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN interest       TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN preferred_time TEXT DEFAULT '';

-- Existing rows are part-time leads; make that explicit (no-op if the default
-- already applied them, harmless to re-run).
UPDATE leads SET type = 'part_time' WHERE type IS NULL OR type = '';

CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
