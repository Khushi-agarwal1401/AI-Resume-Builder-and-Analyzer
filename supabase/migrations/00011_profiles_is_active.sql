-- Add is_active to profiles for admin account deactivation (R-11/R-13)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Index for admin active-user reporting (R-18/R-20)
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON profiles (is_active);
