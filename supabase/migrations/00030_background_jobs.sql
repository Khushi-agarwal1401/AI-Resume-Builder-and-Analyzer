-- Background job tracking for async AI work (ATS analysis, resume generation,
-- job matching). The queue (BullMQ + Redis) is ephemeral; this table is the
-- source of truth for status/results that the frontend polls.

CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('ats-analysis', 'resume-generation', 'job-match')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own background jobs"
  ON background_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own background jobs"
  ON background_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own background jobs"
  ON background_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own background jobs"
  ON background_jobs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS background_jobs_user_created_idx
  ON background_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS background_jobs_status_idx
  ON background_jobs (status);
