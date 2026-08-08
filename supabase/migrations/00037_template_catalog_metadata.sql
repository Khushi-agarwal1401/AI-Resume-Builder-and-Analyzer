-- Template catalog marketplace metadata (Epic: template marketplace).
--
--   1. Relax the templates.category CHECK so marketplace categories
--      (technical, academic, designer, professional, premium, …) can be stored
--      without re-running a migration every time the catalog grows.
--   2. Add marketplace metadata columns used by search/filtering/admin:
--      target_roles, experience_levels, ats_friendly, layout, source_*.
--   3. Re-key the 6 legacy camelCase built-in rows ('Modern' -> 'modern', …)
--      so they match the app's stable kebab-case template keys, then
--      idempotently upsert the 8 built-in designs with full metadata.
--
-- This migration NEVER deletes templates; it only renames + enriches.

-- 1. Relax the category constraint (was: the 8 keys + 'imported').
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_category_check;
ALTER TABLE templates
ADD CONSTRAINT templates_category_check CHECK (
    category IN (
      'ats-professional',
      'modern',
      'minimal',
      'executive',
      'student',
      'creative',
      'executive-sidebar',
      'modern-card',
      'imported',
      'ats-friendly',
      'professional',
      'technical',
      'academic',
      'designer',
      'premium'
    )
  );

-- 2. Marketplace metadata columns (idempotent).
ALTER TABLE templates ADD COLUMN IF NOT EXISTS target_roles text[] DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS experience_levels text[] DEFAULT '{}';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS ats_friendly boolean DEFAULT false;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS layout text;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS source_license text;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS source_author text;

-- 3a. Re-key the legacy camelCase seed rows from migration 00007 to the app's
-- kebab-case template keys. Safe because no kebab-case built-in row exists yet.
UPDATE templates SET component_key = 'ats-professional' WHERE component_key = 'AtsProfessional';
UPDATE templates SET component_key = 'modern' WHERE component_key = 'Modern';
UPDATE templates SET component_key = 'student' WHERE component_key = 'Student';
UPDATE templates SET component_key = 'minimal' WHERE component_key = 'Minimal';
UPDATE templates SET component_key = 'executive' WHERE component_key = 'Executive';
UPDATE templates SET component_key = 'creative' WHERE component_key = 'Creative';

-- 3b. Enrich the 8 built-in designs (idempotent via component_key UNIQUE).
INSERT INTO templates (
    name,
    category,
    description,
    component_key,
    is_active,
    sort_order,
    target_roles,
    experience_levels,
    ats_friendly,
    layout,
    source_url,
    source_license,
    source_author
  )
VALUES (
    'ATS Professional',
    'ats-professional',
    'A pure single-column, monochrome layout with standard section headings and zero icons, graphics, or sidebars. The layout parsers read flawlessly.',
    'ats-professional',
    true,
    1,
    ARRAY[
      'Software Engineer',
      'Full Stack Developer',
      'Backend Developer',
      'Data Engineer',
      'Finance / Consultant',
      'HR / Recruiter',
      'Academic / Researcher / Professor',
      'Student / Intern / Fresher'
    ],
    ARRAY['fresher', 'experienced', 'executive', 'internship'],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern',
    'modern',
    'A balanced single-column layout with a split header, accent-colored section titles, and crisp dividers. Modern hierarchy that stays parser-friendly.',
    'modern',
    true,
    2,
    ARRAY[
      'Software Engineer',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'DevOps Engineer',
      'Cloud Engineer',
      'Data Scientist / Analyst',
      'Product Manager',
      'Marketing / Sales'
    ],
    ARRAY['fresher', 'experienced', 'executive', 'internship'],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Student',
    'student',
    'Education-first design with a colored header band, academic projects as cards, and skill chips. Built for students and recent graduates.',
    'student',
    true,
    3,
    ARRAY['Student / Intern / Fresher', 'Academic / Researcher / Professor'],
    ARRAY['student', 'internship', 'fresher'],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Minimal',
    'minimal',
    'Ultra-clean, generous whitespace, thin hairlines, and a light typographic hierarchy. Monochrome and parser-friendly with an editorial calm.',
    'minimal',
    true,
    4,
    ARRAY[
      'Product / UX Designer',
      'Marketing / Sales',
      'Data Scientist / Analyst',
      'SRE / Platform Engineer'
    ],
    ARRAY['fresher', 'experienced', 'internship'],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Executive',
    'executive',
    'A serif, editorial layout with a commanding name header, executive summary, quantified achievements, and a two-column competencies area.',
    'executive',
    true,
    5,
    ARRAY[
      'CEO / Founder / Executive',
      'Finance / Consultant',
      'Engineering Director / Tech Lead',
      'CTO / VP Engineering'
    ],
    ARRAY['executive', 'experienced'],
    false,
    'two-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Executive Sidebar',
    'executive-sidebar',
    'A premium two-column layout with a dark sidebar for contact, skills, and certifications, and a focused main column for experience and impact.',
    'executive-sidebar',
    true,
    6,
    ARRAY[
      'CTO / VP Engineering',
      'Engineering Director / Tech Lead',
      'CEO / Founder / Executive',
      'Engineering Manager'
    ],
    ARRAY['executive', 'experienced'],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Card Modern',
    'modern-card',
    'Rounded card sections with colored left borders and skill chips on a soft gray canvas. A fresh product-minded look for tech and product roles.',
    'modern-card',
    true,
    7,
    ARRAY[
      'Product Manager',
      'Product / UX Designer',
      'Frontend Developer',
      'Software Engineer',
      'Full Stack Developer',
      'AI Engineer',
      'Machine Learning Engineer'
    ],
    ARRAY['internship', 'fresher', 'experienced'],
    false,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Creative',
    'creative',
    'A bold sidebar layout with a profile card, skill meters, and a timeline of experience. Maximum visual identity — not ATS-first.',
    'creative',
    true,
    8,
    ARRAY['Product / UX Designer', 'Marketing / Sales'],
    ARRAY['internship', 'fresher', 'experienced'],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ) ON CONFLICT (component_key) DO
UPDATE
SET name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  target_roles = EXCLUDED.target_roles,
  experience_levels = EXCLUDED.experience_levels,
  ats_friendly = EXCLUDED.ats_friendly,
  layout = EXCLUDED.layout,
  source_url = EXCLUDED.source_url,
  source_license = EXCLUDED.source_license,
  source_author = EXCLUDED.source_author;
