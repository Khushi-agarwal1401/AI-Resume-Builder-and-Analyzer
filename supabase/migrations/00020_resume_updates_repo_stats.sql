-- A-06: Surface GitHub stars/forks on repo cards
ALTER TABLE resume_updates
  ADD COLUMN IF NOT EXISTS repo_stars INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repo_forks INTEGER DEFAULT 0;
