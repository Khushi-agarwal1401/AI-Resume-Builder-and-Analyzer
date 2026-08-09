-- ═══════════════════════════════════════════════════════════════════════════
-- Consolidated Neon schema for AI Resume Builder & Analyzer
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Single schema that replaces the old per-feature migration set. Notes:
--   • No RLS policies — ownership is enforced in application code via the
--     NextAuth session user id.
--   • `profiles` is the user store: it owns its id (gen_random_uuid()),
--     has no FK to an external auth table, and carries password_hash +
--     reset-token columns.
--   • `references`, `exports`, `resume_versions` FK to profiles(id).
--
-- Idempotent: drops the app tables first, then recreates everything.
-- Apply with:  psql "$DATABASE_URL" -f db/schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

DROP TABLE IF EXISTS
  exports,
  "references",
  resume_versions,
  background_jobs,
  webhook_events,
  notifications,
  admin_audit_log,
  ats_analyses,
  templates,
  resume_updates,
  applications,
  settings,
  prompts,
  usage_counts,
  subscriptions,
  subscription_plans,
  job_analyses,
  activities,
  volunteer,
  publications,
  open_source,
  leadership,
  coding_profiles,
  languages,
  achievements,
  certifications,
  skills,
  projects,
  experience,
  education,
  resumes,
  profiles
CASCADE;

DROP TYPE IF EXISTS application_status;
DROP TYPE IF EXISTS update_source;
DROP TYPE IF EXISTS update_status;

-- ── Profiles (the user store) ──────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('student', 'experienced')),
  college_name TEXT,
  degree TEXT,
  graduation_year TEXT,
  current_position TEXT,
  experience_years INTEGER,
  industry TEXT,
  current_company TEXT,
  desired_role TEXT,
  desired_company TEXT,
  desired_industry TEXT,
  salary_range TEXT,
  work_type TEXT CHECK (work_type IN ('remote', 'hybrid', 'onsite')),
  github_connected BOOLEAN DEFAULT false,
  github_token TEXT,
  linkedin_connected BOOLEAN DEFAULT false,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_seen_at TIMESTAMPTZ,
  password_hash TEXT,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX profiles_email_idx ON profiles (LOWER(email));
CREATE INDEX profiles_role_idx ON profiles (role);
CREATE INDEX profiles_created_at_idx ON profiles (created_at);
CREATE INDEX profiles_role_created_at_idx ON profiles (role, created_at);
CREATE INDEX profiles_is_active_idx ON profiles (is_active);
CREATE INDEX profiles_last_seen_at_idx ON profiles (last_seen_at);

-- ── Resumes ────────────────────────────────────────────────────────────────
CREATE TABLE resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  template TEXT NOT NULL DEFAULT 'modern' CHECK (template IN ('ats-professional', 'modern', 'student', 'minimal', 'executive', 'creative', 'executive-sidebar', 'modern-card')),
  personal_info JSONB DEFAULT '{}'::jsonb,
  summary TEXT DEFAULT '',
  target_level TEXT DEFAULT '',
  coursework JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ats_score INTEGER,
  ats_breakdown JSONB DEFAULT '{}'::jsonb,
  accent_color TEXT CHECK (accent_color IS NULL OR accent_color ~ '^#[0-9a-fA-F]{6}$'),
  font_family TEXT NOT NULL DEFAULT 'sans' CHECK (font_family IN ('sans', 'serif', 'mono')),
  share_token TEXT,
  share_enabled BOOLEAN NOT NULL DEFAULT false,
  share_updated_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  section_order JSONB DEFAULT '[]'::jsonb,
  download_count INTEGER NOT NULL DEFAULT 0,
  custom_sections JSONB NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_resumes_user_id ON resumes (user_id);
CREATE INDEX resumes_template_idx ON resumes (template);
CREATE UNIQUE INDEX resumes_share_token_idx ON resumes (share_token) WHERE share_token IS NOT NULL;

-- ── Resume sections ────────────────────────────────────────────────────────
CREATE TABLE education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  cgpa TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  "classXII" TEXT DEFAULT '',
  "classX" TEXT DEFAULT '',
  semester TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_education_resume_id ON education (resume_id);

CREATE TABLE experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  current BOOLEAN DEFAULT false,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_experience_resume_id ON experience (resume_id);

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  technologies JSONB DEFAULT '[]'::jsonb,
  live_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  client TEXT DEFAULT '',
  teamSize TEXT DEFAULT '',
  impact TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_projects_resume_id ON projects (resume_id);

CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  technical JSONB DEFAULT '[]'::jsonb,
  soft JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  frameworks JSONB DEFAULT '[]'::jsonb
);
CREATE INDEX idx_skills_resume_id ON skills (resume_id);
CREATE UNIQUE INDEX skills_resume_id_key ON skills (resume_id);

CREATE TABLE certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT DEFAULT '',
  date TEXT DEFAULT '',
  url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_certifications_resume_id ON certifications (resume_id);

CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_achievements_resume_id ON achievements (resume_id);

CREATE TABLE languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  proficiency TEXT CHECK (proficiency IN ('native', 'fluent', 'advanced', 'intermediate', 'basic')),
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX idx_languages_resume_id ON languages (resume_id);

-- Extended section tables (previously present only in the live DB).
CREATE TABLE coding_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leadership (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE open_source (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE publications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  date TEXT DEFAULT '',
  url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE volunteer (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  organization TEXT NOT NULL,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Job analyses ───────────────────────────────────────────────────────────
CREATE TABLE job_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  jd_snippet TEXT DEFAULT '',
  match_percentage INTEGER DEFAULT 0,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX job_analyses_match_percentage_idx ON job_analyses (match_percentage);

-- ── Subscriptions / billing ────────────────────────────────────────────────
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  max_resumes INTEGER NOT NULL DEFAULT 1,
  max_ats_checks INTEGER NOT NULL DEFAULT 0,
  max_jd_analyses INTEGER NOT NULL DEFAULT 0,
  max_ai_actions INTEGER NOT NULL DEFAULT 0,
  has_advanced_templates BOOLEAN DEFAULT false,
  has_export_pdf BOOLEAN DEFAULT false,
  has_cover_letter BOOLEAN DEFAULT false,
  has_priority_support BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id TEXT REFERENCES subscription_plans(id) NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX subscriptions_plan_id_idx ON subscriptions (plan_id);

CREATE TABLE usage_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  metric TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, metric)
);
CREATE INDEX idx_usage_counts_user_metric ON usage_counts (user_id, metric);

CREATE TABLE prompts (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX prompts_key_idx ON prompts (key);

CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  resume_updates BOOLEAN DEFAULT true NOT NULL,
  job_alerts BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Applications ───────────────────────────────────────────────────────────
CREATE TYPE application_status AS ENUM ('applied', 'interview', 'rejected', 'offer');

CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  date_applied DATE DEFAULT CURRENT_DATE,
  status application_status NOT NULL DEFAULT 'applied',
  notes TEXT DEFAULT '',
  outcome_type TEXT CHECK (outcome_type IN ('round_reached', 'offer', 'rejected')),
  outcome_notes TEXT DEFAULT '',
  interview_round INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_applications_user_id ON applications (user_id);
CREATE INDEX idx_applications_user_status ON applications (user_id, status);

-- ── Resume updates (GitHub auto-detection) ─────────────────────────────────
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
  repo_stars INTEGER DEFAULT 0,
  repo_forks INTEGER DEFAULT 0,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  status update_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_resume_updates_user_id ON resume_updates (user_id);
CREATE INDEX idx_resume_updates_status ON resume_updates (user_id, status);

-- ── Templates catalog ──────────────────────────────────────────────────────
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'ats-professional', 'modern', 'minimal', 'executive', 'student', 'creative',
    'executive-sidebar', 'modern-card', 'imported', 'ats-friendly',
    'professional', 'technical', 'academic', 'designer', 'premium'
  )),
  description TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  component_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  target_roles TEXT[] DEFAULT '{}',
  experience_levels TEXT[] DEFAULT '{}',
  ats_friendly BOOLEAN DEFAULT false,
  layout TEXT,
  source_url TEXT,
  source_license TEXT,
  source_author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ATS analyses ───────────────────────────────────────────────────────────
CREATE TABLE ats_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  resume_title TEXT DEFAULT '',
  score INTEGER NOT NULL,
  breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ats_analyses_user_created_idx ON ats_analyses (user_id, created_at DESC);

-- ── Admin ──────────────────────────────────────────────────────────────────
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  changes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX admin_audit_log_admin_created_idx ON admin_audit_log (admin_id, created_at DESC);
CREATE INDEX admin_audit_log_target_idx ON admin_audit_log (target_type, target_id);

-- ── Notifications ──────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- ── Webhook idempotency ────────────────────────────────────────────────────
CREATE TABLE webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Background jobs ────────────────────────────────────────────────────────
CREATE TABLE background_jobs (
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
CREATE INDEX background_jobs_user_created_idx ON background_jobs (user_id, created_at DESC);
CREATE INDEX background_jobs_status_idx ON background_jobs (status);

-- ── Resume versions ────────────────────────────────────────────────────────
CREATE TABLE resume_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Untitled version',
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_resume_versions_resume_id ON resume_versions (resume_id, created_at DESC);
CREATE INDEX idx_resume_versions_user_id ON resume_versions (user_id);

-- ── References ─────────────────────────────────────────────────────────────
CREATE TABLE "references" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relationship TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_references_user_id ON "references" (user_id);

-- ── Exports ────────────────────────────────────────────────────────────────
CREATE TABLE exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  template TEXT NOT NULL,
  file_size BIGINT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exports_resume_id ON exports (resume_id);
CREATE INDEX idx_exports_user_id ON exports (user_id);

-- ── Seed: subscription plans ───────────────────────────────────────────────
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, max_resumes, max_ats_checks, max_jd_analyses, max_ai_actions, has_advanced_templates, has_export_pdf, has_cover_letter, has_priority_support, sort_order) VALUES
('free', 'Free', 'Get started with basic resume building', 0, 0, '["1 resume", "1 template", "Basic AI suggestions", "Community support"]'::jsonb, 1, 3, 3, 20, false, false, false, false, 0),
('pro', 'Pro', 'Unlock everything for your job search', 1200, 9000, '["Unlimited resumes", "All 8 templates", "Unlimited AI actions", "ATS score & keyword matching", "Cover letter generator", "PDF export", "Priority support"]'::jsonb, 99, 99, 99, 999, true, true, true, true, 1);

-- ── Seed: template catalog (8 built-in designs) ────────────────────────────
INSERT INTO templates (name, category, description, component_key, is_active, sort_order, target_roles, experience_levels, ats_friendly, layout, source_url, source_license, source_author) VALUES
('ATS Professional', 'ats-professional', 'A pure single-column, monochrome layout with standard section headings and zero icons, graphics, or sidebars. The layout parsers read flawlessly.', 'ats-professional', true, 1, ARRAY['Software Engineer','Full Stack Developer','Backend Developer','Data Engineer','Finance / Consultant','HR / Recruiter','Academic / Researcher / Professor','Student / Intern / Fresher'], ARRAY['fresher','experienced','executive','internship'], true, 'single-column', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff'),
('Modern', 'modern', 'A balanced single-column layout with a split header, accent-colored section titles, and crisp dividers. Modern hierarchy that stays parser-friendly.', 'modern', true, 2, ARRAY['Software Engineer','Full Stack Developer','Frontend Developer','Backend Developer','DevOps Engineer','Cloud Engineer','Data Scientist / Analyst','Product Manager','Marketing / Sales'], ARRAY['fresher','experienced','executive','internship'], true, 'single-column', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff'),
('Student', 'student', 'Education-first design with a colored header band, academic projects as cards, and skill chips. Built for students and recent graduates.', 'student', true, 3, ARRAY['Student / Intern / Fresher','Academic / Researcher / Professor'], ARRAY['student','internship','fresher'], true, 'single-column', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff'),
('Minimal', 'minimal', 'Ultra-clean, generous whitespace, thin hairlines, and a light typographic hierarchy. Monochrome and parser-friendly with an editorial calm.', 'minimal', true, 4, ARRAY['Product / UX Designer','Marketing / Sales','Data Scientist / Analyst','SRE / Platform Engineer'], ARRAY['fresher','experienced','internship'], true, 'single-column', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff'),
('Executive', 'executive', 'A serif, editorial layout with a commanding name header, executive summary, quantified achievements, and a two-column competencies area.', 'executive', true, 5, ARRAY['CEO / Founder / Executive','Finance / Consultant','Engineering Director / Tech Lead','CTO / VP Engineering'], ARRAY['executive','experienced'], false, 'two-column', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff'),
('Executive Sidebar', 'executive-sidebar', 'A premium two-column layout with a dark sidebar for contact, skills, and certifications, and a focused main column for experience and impact.', 'executive-sidebar', true, 6, ARRAY['CTO / VP Engineering','Engineering Director / Tech Lead','CEO / Founder / Executive','Engineering Manager'], ARRAY['executive','experienced'], false, 'sidebar', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff'),
('Card Modern', 'modern-card', 'Rounded card sections with colored left borders and skill chips on a soft gray canvas. A fresh product-minded look for tech and product roles.', 'modern-card', true, 7, ARRAY['Product Manager','Product / UX Designer','Frontend Developer','Software Engineer','Full Stack Developer','AI Engineer','Machine Learning Engineer'], ARRAY['internship','fresher','experienced'], false, 'single-column', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff'),
('Creative', 'creative', 'A bold sidebar layout with a profile card, skill meters, and a timeline of experience. Maximum visual identity — not ATS-first.', 'creative', true, 8, ARRAY['Product / UX Designer','Marketing / Sales'], ARRAY['internship','fresher','experienced'], false, 'sidebar', 'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer', 'MIT', 'Freebuff');

COMMIT;
