-- Add a role column to profiles for admin / user management
ALTER TABLE profiles
  ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Existing RLS policies already protect the profiles table;
-- admins can now be managed by setting role = 'admin' on any profile.

-- Allow users with role = 'admin' to view any profile (needed for admin panel)
CREATE POLICY \"Admins can view all profiles\"\n  ON profiles FOR SELECT\n  USING (\n    auth.uid() = id OR\n    EXISTS (\n      SELECT 1 FROM profiles\n      WHERE id = auth.uid() AND role = 'admin'\n    )\n  );
