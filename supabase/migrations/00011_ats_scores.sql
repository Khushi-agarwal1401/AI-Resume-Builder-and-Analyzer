-- K-03 / K-07: Persist real ATS scores on resumes + history for analytics trend

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS ats_score INTEGER,
  ADD COLUMN IF NOT EXISTS ats_breakdown JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS ats_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  resume_title TEXT DEFAULT '',
  score INTEGER NOT NULL,
  breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ats_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ats analyses"
  ON ats_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ats analyses"
  ON ats_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ats analyses"
  ON ats_analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ats_analyses_user_created_idx
  ON ats_analyses (user_id, created_at DESC);
