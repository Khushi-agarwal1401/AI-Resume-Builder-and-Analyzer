-- ═══════════════════════════════════════════════════════════════
-- Migration 00028: durable Stripe webhook idempotency (K-14)
-- ═══════════════════════════════════════════════════════════════
--
-- The webhook previously deduplicated events with an in-memory Set, which is
-- per-instance and lost on every redeploy/scale-out — a replayed webhook could
-- be processed again. This table records processed Stripe event ids so a
-- duplicate delivery no-ops across instances and restarts.
--
-- Access: no RLS policies are granted — the webhook writes through the
-- service-role client (bypasses RLS), and no anon/authenticated role ever
-- touches this table.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
