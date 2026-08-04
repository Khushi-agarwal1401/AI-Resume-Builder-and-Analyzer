-- Admin audit log (R-14): records who changed what in the admin panel.
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  changes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins may read and write the audit log (inserts happen under the admin's
-- authenticated session from admin route handlers).
CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can write audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (public.is_admin());
