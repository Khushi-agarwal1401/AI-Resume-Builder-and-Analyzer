CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  max_resumes INTEGER NOT NULL DEFAULT 1,
  max_ats_checks INTEGER NOT NULL DEFAULT 0,
  max_jd_analyses INTEGER NOT NULL DEFAULT 0,
  max_ai_actions INTEGER NOT NULL DEFAULT 0,
  has_advanced_templates BOOLEAN DEFAULT false,
  has_export_pdf BOOLEAN DEFAULT false,
  has_cover_letter BOOLEAN DEFAULT false,
  has_priority_support BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON subscription_plans FOR SELECT USING (active = true);

CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id TEXT REFERENCES subscription_plans(id) NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (true);

CREATE TABLE usage_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  metric TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, metric)
);

ALTER TABLE usage_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_counts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage usage" ON usage_counts FOR ALL USING (true);

INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, max_resumes, max_ats_checks, max_jd_analyses, max_ai_actions, has_advanced_templates, has_export_pdf, has_cover_letter, has_priority_support, sort_order) VALUES
('free', 'Free', 'Get started with basic resume building', 0, 0, '["1 resume", "1 template", "Basic AI suggestions", "Community support"]'::jsonb, 1, 3, 3, 20, false, false, false, false, 0),
('pro', 'Pro', 'Unlock everything for your job search', 1200, 9000, '["Unlimited resumes", "All 4 templates", "Unlimited AI actions", "ATS score & keyword matching", "Cover letter generator", "PDF export", "Priority support"]'::jsonb, 99, 99, 99, 999, true, true, true, true, 1);

CREATE TABLE prompts (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage prompts" ON prompts FOR ALL USING (true);

CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own settings" ON settings FOR ALL USING (auth.uid() = user_id);
