-- R-12: Admin template catalog consistency
-- 1. Fix "Anyone can view active templates" policy: the previous USING
--    (is_active = true OR is_active = false) is a tautology that exposes
--    INACTIVE templates to every unauthenticated reader. Only active rows
--    should be readable by the public; admins still see all via their policy.
DROP POLICY IF EXISTS "Anyone can view active templates" ON templates;

CREATE POLICY "Anyone can view active templates"
  ON templates FOR SELECT
  USING (is_active = true);

-- 2. Extend category CHECK to the full 8-template catalog (matches UI/landing
--    template set). The 2 new rows are seeded INACTIVE so they don't appear in
--    the user catalog until resumes.template CHECK is extended (A-02) and an
--    admin activates them — keeps admin set consistent without breaking saves.
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_category_check;
ALTER TABLE templates ADD CONSTRAINT templates_category_check
  CHECK (category IN ('ats-professional', 'modern', 'minimal', 'executive', 'student', 'creative', 'executive-sidebar', 'modern-card'));

INSERT INTO templates (name, category, description, component_key, is_active, sort_order) VALUES
('Exec Sidebar', 'executive-sidebar', 'Two-column sidebar layout with dark accents for senior leadership.', 'ExecutiveSidebar', false, 7),
('Card Modern', 'modern-card', 'Rounded card-style sections with indigo chips for a fresh modern look.', 'ModernCard', false, 8);
