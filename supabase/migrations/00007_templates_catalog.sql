-- Templates catalog table for Admin Template Management (Phase 3, Module 22)
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ats-professional', 'modern', 'minimal', 'executive', 'student', 'creative')),
  description TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  component_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No user_id — this is global catalog data, admin-write / public-read
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON templates FOR SELECT
  USING (is_active = true OR is_active = false);

CREATE POLICY "Admins can manage templates"
  ON templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed the 4 existing templates + 2 placeholder templates for Phase 3
INSERT INTO templates (name, category, description, component_key, sort_order) VALUES
('Modern', 'modern', 'Clean two-column layout with accent sidebar — ideal for most professionals.', 'Modern', 1),
('ATS Professional', 'ats-professional', 'Single-column, ATS-optimized layout with clear section headers for maximum parser compatibility.', 'AtsProfessional', 2),
('Student', 'student', 'Education-first layout highlighting academics, projects, and extracurriculars.', 'Student', 3),
('Minimal', 'minimal', 'Typography-focused design with ample whitespace for a refined, understated look.', 'Minimal', 4),
('Executive', 'executive', 'Leadership-focused layout emphasizing strategic impact, board experience, and high-level results.', 'Executive', 5),
('Creative', 'creative', 'Visually distinctive design with color accents and flexible layout for design and media roles.', 'Creative', 6);
