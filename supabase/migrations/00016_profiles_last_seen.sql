-- R-20: Admin analytics — track last active timestamp for active-users metric
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_last_seen_at_idx ON profiles (last_seen_at);
