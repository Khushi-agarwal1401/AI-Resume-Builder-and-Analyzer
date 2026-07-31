-- Harden prompts RLS (R-14/R-10): the original policy from 00003 allowed ANY
-- user to read AND write prompts (USING true). Instead:
--   • any authenticated user may READ prompts (the AI runtime reads them
--     server-side under the user's session),
--   • only admins may write.
-- Runs after 00004 so public.is_admin() exists.

DROP POLICY IF EXISTS "Admins can manage prompts" ON prompts;

CREATE POLICY "Authenticated can read prompts"
  ON prompts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage prompts"
  ON prompts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
