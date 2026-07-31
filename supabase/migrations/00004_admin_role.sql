-- Add a role column to profiles for admin / user management
ALTER TABLE profiles
  ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Existing RLS policies already protect the profiles table;
-- admins can now be managed by setting role = 'admin' on any profile.

-- SECURITY DEFINER helper: runs as owner, avoids RLS recursion when
-- the profiles policy checks the caller's role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Allow users with role = 'admin' to view any profile (needed for admin panel)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    public.is_admin()
  );
