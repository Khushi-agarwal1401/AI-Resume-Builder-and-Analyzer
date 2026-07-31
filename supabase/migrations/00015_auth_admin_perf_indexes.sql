-- R-18: Auth & admin performance indexes
-- Covers profiles lookups used by auth + isAdmin, admin stats counts,
-- and audit log queries. All are CREATE INDEX IF NOT EXISTS (idempotent).

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles (created_at);
CREATE INDEX IF NOT EXISTS profiles_role_created_at_idx ON profiles (role, created_at);

-- Admin stats: templatesUsed breakdown
CREATE INDEX IF NOT EXISTS resumes_template_idx ON resumes (template);

-- Admin stats: proUsers count + recent signups ordering
CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON subscriptions (plan_id);

-- Admin stats: average compatibility score
CREATE INDEX IF NOT EXISTS job_analyses_match_percentage_idx ON job_analyses (match_percentage);

-- Audit log: filter by admin + target, order by timestamp
CREATE INDEX IF NOT EXISTS admin_audit_log_admin_created_idx ON admin_audit_log (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON admin_audit_log (target_type, target_id);

-- Prompts runtime lookups (R-10): by key
CREATE INDEX IF NOT EXISTS prompts_key_idx ON prompts (key);
