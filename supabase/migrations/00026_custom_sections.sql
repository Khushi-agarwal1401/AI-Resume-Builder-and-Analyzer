-- K-04: user-defined custom sections.
-- custom_sections: JSONB map of sectionId -> { title, items[] } for sections the
-- user creates in the builder (name + items are fully user-defined, so a fixed
-- table would not fit). Section ids are prefixed "custom-" and referenced from
-- section_order like any other section.
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS custom_sections JSONB NOT NULL DEFAULT '{}';
