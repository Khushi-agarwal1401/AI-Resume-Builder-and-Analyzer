-- A-03: Template theme / accent customization.
-- accent_color: user-chosen hex accent (NULL = template default)
-- font_family: sans | serif | mono (maps to Helvetica / Times-Roman / Courier in PDF)
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS accent_color TEXT CHECK (accent_color IS NULL OR accent_color ~ '^#[0-9a-fA-F]{6}$'),
  ADD COLUMN IF NOT EXISTS font_family TEXT NOT NULL DEFAULT 'sans' CHECK (font_family IN ('sans', 'serif', 'mono'));

-- Preserve the Executive template's serif look for existing resumes.
UPDATE resumes SET font_family = 'serif' WHERE template = 'executive' AND font_family = 'sans';
