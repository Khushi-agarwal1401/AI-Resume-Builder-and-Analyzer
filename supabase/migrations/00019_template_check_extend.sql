-- A-02: Extend resumes.template CHECK to full 8-template catalog
-- (executive-sidebar + modern-card existed in UI/PDF templates but not the DB)
ALTER TABLE resumes DROP CONSTRAINT IF EXISTS resumes_template_check;
ALTER TABLE resumes ADD CONSTRAINT resumes_template_check
  CHECK (template IN ('ats-professional', 'modern', 'student', 'minimal', 'executive', 'creative', 'executive-sidebar', 'modern-card'));

-- Activate the two previously-seeded-inactive templates so the user catalog
-- matches the 8 templates advertised in the UI
UPDATE templates SET is_active = true WHERE component_key IN ('ExecutiveSidebar', 'ModernCard');
