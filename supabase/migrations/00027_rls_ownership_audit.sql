-- ═══════════════════════════════════════════════════════════════
-- Migration 00027: RLS ownership audit (K-13)
-- ═══════════════════════════════════════════════════════════════
--
-- Fixes two "FOR ALL USING (true)" policies that granted every
-- authenticated (and anonymous) user full read/write access to ALL
-- rows of subscriptions and usage_counts. Supabase's service_role
-- bypasses RLS entirely, so a "service role can manage" policy is
-- both unnecessary AND a security hole: the name is misleading — the
-- policy applies to every role, not just the service role.
--
-- Fix strategy:
--   • subscriptions  — the app only ever writes subscriptions from the
--                      Stripe webhook, which now uses the service-role
--                      client (bypasses RLS). Authenticated users only
--                      need own-row SELECT (already present). No write
--                      policies for the user session are required.
--   • usage_counts   — incrementUsage() legitimately writes under the
--                      user's session (server client), so replace the
--                      open policy with proper own-row INSERT/UPDATE
--                      policies (own-row SELECT already present).
--
-- Also hardens the extended resume section tables (coding_profiles,
-- leadership, open_source, publications, volunteer, activities).
-- These tables exist only in the live DB (they are referenced by the
-- builder but were never defined in a committed migration), so their
-- RLS state could not be guaranteed. The DO block below enables RLS
-- and installs the same owner-scoped "EXISTS(resumes)" policy used by
-- the base section tables — idempotently, only if the table exists.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. subscriptions: remove the open policy ─────────────────────
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

-- ── 2. usage_counts: remove the open policy, add own-row writes ──
DROP POLICY IF EXISTS "Service role can manage usage" ON usage_counts;

CREATE POLICY "Users can insert own usage"
  ON usage_counts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_counts FOR UPDATE
  USING (auth.uid() = user_id);

-- ── 3. Harden the extended resume section tables (live DB only) ──
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'coding_profiles', 'leadership', 'open_source',
    'publications', 'volunteer', 'activities'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        'Users can manage ' || t || ' of own resumes',
        t
      );
      EXECUTE format(
        $p$CREATE POLICY %I ON public.%I FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.resumes
              WHERE resumes.id = %I.resume_id
                AND resumes.user_id = auth.uid()
            )
          )$p$,
        'Users can manage ' || t || ' of own resumes',
        t,
        t
      );
    END IF;
  END LOOP;
END;
$$;
