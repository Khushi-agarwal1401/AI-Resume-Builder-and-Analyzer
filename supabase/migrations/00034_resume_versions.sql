-- Resume Version Manager: stores snapshots of resumes for fork/diff/rollback (PR #58 feature).
-- Each row is a full snapshot of the resume at a point in time.
CREATE TABLE IF NOT EXISTS resume_versions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id   UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT 'Untitled version',
  snapshot    JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index: all versions of a resume, newest first
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON resume_versions(resume_id, created_at DESC);
-- Index: all versions owned by a user
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON resume_versions(user_id);
-- RLS: only the owner can read/write
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resume_versions_select" ON resume_versions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "resume_versions_insert" ON resume_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resume_versions_delete" ON resume_versions
  FOR DELETE USING (auth.uid() = user_id);