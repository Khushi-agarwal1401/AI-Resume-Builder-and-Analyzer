-- Epic 3, Task 3.1: favorite / pinned resumes.
-- is_pinned: starred resumes are surfaced in a "Pinned" section at the top of
-- the dashboard. No cap is enforced at the DB level (the client enforces the
-- max-5 rule and the API returns a friendly error past it).
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
