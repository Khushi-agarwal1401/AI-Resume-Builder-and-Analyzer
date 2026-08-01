-- A-19: Public resume sharing.
-- share_token: unguessable token used in /share/[token] URLs
-- share_enabled: opt-in flag (public link is inert until enabled)
-- view_count: incremented on each public view (feeds analytics / K-02)
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS share_token TEXT,
  ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS resumes_share_token_idx ON resumes (share_token) WHERE share_token IS NOT NULL;
