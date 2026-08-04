-- ═══════════════════════════════════════════════════════════════
-- Migration 00010: delete_user_account RPC
-- ═══════════════════════════════════════════════════════════════
--
-- Creates the delete_user_account() RPC function that the settings
-- page (src/app/settings/page.tsx) calls when a user deletes their
-- account.
--
-- Why this is needed:
--   The profiles table uses ON DELETE CASCADE from auth.users, so
--   deleting from auth.users cleans up profiles → resumes → all
--   section tables → subscriptions → settings → usage_counts →
--   job_analyses → applications → resume_updates.
--
--   However, the anon key cannot delete from auth.users directly.
--   This SECURITY DEFINER function runs with the privileges of the
--   function owner (typically the database owner / service role),
--   allowing the authenticated user to delete their own auth record.
--
-- Security:
--   • SECURITY DEFINER — runs as the owner (superuser-like)
--   • Verifies auth.uid() === the user being deleted
--   • Only deletes the calling user's own account
--   • Returns void (success) or raises an error
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the caller's user ID from the auth context
  user_id := auth.uid();

  -- Reject unauthenticated calls
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING HINT = 'You must be signed in to delete your account.';
  END IF;

  -- Delete from auth.users.
  -- The ON DELETE CASCADE on profiles(id) references auth.users(id),
  -- so this single deletion cascades to:
  --   profiles → resumes → education, experience, projects, skills,
  --               certifications, achievements, languages
  --           → subscriptions, settings, usage_counts
  --           → job_analyses, applications, resume_updates
  DELETE FROM auth.users WHERE id = user_id;

  -- If the delete failed silently (shouldn't happen due to FK), raise
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found' USING HINT = 'The account could not be found. Contact support.';
  END IF;
END;
$$;

-- Revoke execute from public; only authenticated users can call it
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
