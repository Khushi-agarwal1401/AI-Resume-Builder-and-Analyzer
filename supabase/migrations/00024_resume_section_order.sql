-- Custom resume section order (builder "Arrange Sections" feature).
-- Stores an ordered array of section ids (e.g. ["personalInfo","summary",...]).
-- Empty array / NULL = use the resume type's default section order.
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT '[]'::jsonb;
