-- ══════════════════════════════════════════════════════════════════════════
-- RLS & data-privacy audit runbook (K-13) — run against the LIVE database.
--
-- How to use:
--   1. Open the Supabase SQL editor (Dashboard → SQL Editor) for the target
--      project.
--   2. Run this file top-to-bottom BEFORE launch, and re-run it after the
--      account-deletion live test.
--   3. Every block prints a result. "EXPECTED" lines state what a healthy
--      database looks like. Anything else = investigate before launch.
--
-- These checks CANNOT be done statically from the repo — they require a live
-- database. This runbook is the acceptance gate for K-13.
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 1. RLS coverage: every user-data table must have rowsecurity = on.
--    EXPECTED: all tables below show "on". If any shows "off", that table is
--    readable/writable by every anon/authenticated user — fix immediately.
-- ──────────────────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Per-table policy inventory (helps spot USING (true) / WITH CHECK (true)
--    policies or missing commands). EXPECTED: user tables have only
--    owner-scoped policies (auth.uid() = user_id or EXISTS(resumes …)).
-- ──────────────────────────────────────────────────────────────────────────
SELECT
  c.relname AS table_name,
  p.polname AS policy_name,
  CASE p.polcmd
    WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE'
    ELSE 'ALL' END AS command,
  pg_get_expr(p.polqual, p.polrelid) AS using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, p.polname;

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Open-policy scan: any policy whose USING or WITH CHECK is literally
--    `true` on a table with user data is a cross-user hole.
--    EXPECTED: no rows. (subscriptions/usage_counts were fixed in 00027.)
-- ──────────────────────────────────────────────────────────────────────────
SELECT c.relname AS table_name, p.polname AS policy_name,
       pg_get_expr(p.polqual, p.polrelid) AS using_expr
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND (pg_get_expr(p.polqual, p.polrelid) = 'true'
       OR pg_get_expr(p.polwithcheck, p.polrelid) = 'true');

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Cross-user access test (THE core acceptance check).
--    EXPECTED: every request below returns 404 / only the caller's own rows,
--    proving user B cannot see user A's data.
--
--    This must be done with TWO REAL accounts signed in (e.g. two incognito
--    windows). It CANNOT be done from the SQL editor: RLS policies read
--    auth.uid() from the request's JWT, which the SQL editor never carries
--    (auth.uid() is NULL there, and SET ROLE authenticated does not add JWT
--    claims). The API is the only faithful RLS client.
--
--    Steps:
--      a) User A creates a resume + an ATS analysis + an application.
--      b) As User B, call the following with User B's session token:
--           GET  /api/resumes/<A's resume id>            → 404
--           GET  /api/resumes                            → only B's resumes
--           GET  /api/ats-analyses                       → only B's analyses
--           GET  /api/applications                       → only B's apps
--           GET  /api/export/<A's resume id>             → 404 / upgrade gate
--           GET  /api/data-export                        → only B's data
--           GET  /share/<A's share token>                → allowed (public by
--                                                          design) but only
--                                                          if A enabled it
--      c) As User B, run each of the above against a resume User A shares
--         with a KNOWN OTHER resume id; confirm 404 for non-owned ids.
-- ──────────────────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Account-deletion completeness: after User A deletes their account,
--    no orphan rows may remain anywhere.
--    Steps: (a) sign in as A and Delete Account from Settings; (b) replace
--    <DELETED_USER_ID> with A's old UUID (grab it before deletion, or check
--    auth.users history) and run the checks below; (c) EXPECTED: 0 rows
--    everywhere and auth.users has no row for A.
-- ──────────────────────────────────────────────────────────────────────────
/*
SELECT 'profiles' AS tbl, count(*) FROM public.profiles WHERE id = '<DELETED_USER_ID>'
UNION ALL SELECT 'resumes', count(*) FROM public.resumes WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'education', count(*) FROM public.education e JOIN public.resumes r ON r.id = e.resume_id WHERE r.user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'experience', count(*) FROM public.experience e JOIN public.resumes r ON r.id = e.resume_id WHERE r.user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'projects', count(*) FROM public.projects p JOIN public.resumes r ON r.id = p.resume_id WHERE r.user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'skills', count(*) FROM public.skills s JOIN public.resumes r ON r.id = s.resume_id WHERE r.user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'certifications', count(*) FROM public.certifications c JOIN public.resumes r ON r.id = c.resume_id WHERE r.user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'achievements', count(*) FROM public.achievements a JOIN public.resumes r ON r.id = a.resume_id WHERE r.user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'languages', count(*) FROM public.languages l JOIN public.resumes r ON r.id = l.resume_id WHERE r.user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'subscriptions', count(*) FROM public.subscriptions WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'usage_counts', count(*) FROM public.usage_counts WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'settings', count(*) FROM public.settings WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'job_analyses', count(*) FROM public.job_analyses WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'applications', count(*) FROM public.applications WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'resume_updates', count(*) FROM public.resume_updates WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'ats_analyses', count(*) FROM public.ats_analyses WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'notifications', count(*) FROM public.notifications WHERE user_id = '<DELETED_USER_ID>'
UNION ALL SELECT 'admin_audit_log', count(*) FROM public.admin_audit_log WHERE admin_id = '<DELETED_USER_ID>';
*/

-- ──────────────────────────────────────────────────────────────────────────
-- 6. Generic orphan scan (any user_id/resume_id that points at a deleted row).
--    EXPECTED: 0 rows for every entry.
-- ──────────────────────────────────────────────────────────────────────────
SELECT 'resumes→profiles' AS check_name, count(*) FROM public.resumes r
  LEFT JOIN public.profiles p ON p.id = r.user_id WHERE p.id IS NULL
UNION ALL SELECT 'education→resumes', count(*) FROM public.education e
  LEFT JOIN public.resumes r ON r.id = e.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'experience→resumes', count(*) FROM public.experience e
  LEFT JOIN public.resumes r ON r.id = e.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'projects→resumes', count(*) FROM public.projects p
  LEFT JOIN public.resumes r ON r.id = p.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'skills→resumes', count(*) FROM public.skills s
  LEFT JOIN public.resumes r ON r.id = s.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'certifications→resumes', count(*) FROM public.certifications c
  LEFT JOIN public.resumes r ON r.id = c.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'achievements→resumes', count(*) FROM public.achievements a
  LEFT JOIN public.resumes r ON r.id = a.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'languages→resumes', count(*) FROM public.languages l
  LEFT JOIN public.resumes r ON r.id = l.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'applications→resumes', count(*) FROM public.applications a
  LEFT JOIN public.resumes r ON r.id = a.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'job_analyses→resumes', count(*) FROM public.job_analyses j
  LEFT JOIN public.resumes r ON r.id = j.resume_id WHERE r.id IS NULL
UNION ALL SELECT 'ats_analyses→resumes', count(*) FROM public.ats_analyses a
  LEFT JOIN public.resumes r ON r.id = a.resume_id WHERE r.id IS NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- 7. Function privileges (delete_user_account): only authenticated may EXECUTE.
--    EXPECTED: proacl grants authenticated; anon/PUBLIC revoked.
-- ──────────────────────────────────────────────────────────────────────────
SELECT proname, pg_get_userbyid(proowner) AS owner, proacl
FROM pg_proc
WHERE proname = 'delete_user_account';

-- All checks complete. If anything above was unexpected, fix it and re-run
-- before flipping the switch to production.
