-- The settings page and PUT /api/settings already persist email_notifications
-- alongside resume_updates / job_alerts toggles, but the base table only
-- declared email_notifications + dark_mode. Add the two missing columns so the
-- documented settings surface works against the typed schema.
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS resume_updates BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS job_alerts BOOLEAN DEFAULT true NOT NULL;
