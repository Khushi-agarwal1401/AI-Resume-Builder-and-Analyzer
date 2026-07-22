-- Resume updates table for GitHub auto-detection (Phase 3, Module 17)
CREATE TYPE update_source AS ENUM ('github');
CREATE TYPE update_status AS ENUM ('pending', 'added', 'ignored');

CREATE TABLE resume_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source update_source NOT NULL DEFAULT 'github',
  repo_name TEXT NOT NULL,
  repo_description TEXT DEFAULT '',
  repo_url TEXT DEFAULT '',
  repo_language TEXT DEFAULT '',
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  status update_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resume_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own updates"
  ON resume_updates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own updates"
  ON resume_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own updates"
  ON resume_updates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own updates"
  ON resume_updates FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance (flagged in technical analysis)
CREATE INDEX idx_resume_updates_user_id ON resume_updates(user_id);
CREATE INDEX idx_resume_updates_status ON resume_updates(user_id, status);

-- Add missing indexes on all resume section tables
CREATE INDEX IF NOT EXISTS idx_education_resume_id ON education(resume_id);
CREATE INDEX IF NOT EXISTS idx_experience_resume_id ON experience(resume_id);
CREATE INDEX IF NOT EXISTS idx_projects_resume_id ON projects(resume_id);
CREATE INDEX IF NOT EXISTS idx_skills_resume_id ON skills(resume_id);
CREATE INDEX IF NOT EXISTS idx_certifications_resume_id ON certifications(resume_id);
CREATE INDEX IF NOT EXISTS idx_achievements_resume_id ON achievements(resume_id);
CREATE INDEX IF NOT EXISTS idx_languages_resume_id ON languages(resume_id);

-- Add missing index on resumes table
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- Add composite index on usage_counts (user_id + metric is already UNIQUE, adding explicit index for clarity)
CREATE INDEX IF NOT EXISTS idx_usage_counts_user_metric ON usage_counts(user_id, metric);

-- Extend template CHECK constraint to include new templates
ALTER TABLE resumes DROP CONSTRAINT IF EXISTS resumes_template_check;
ALTER TABLE resumes ADD CONSTRAINT resumes_template_check
  CHECK (template IN ('ats-professional', 'modern', 'student', 'minimal', 'executive', 'creative'));
