-- Subscriptions & Payment Management System Database Schema

-- 1. Payment Requests Table
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BDT',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  payment_proof_url TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BDT',
  duration_days INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscription History Table
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  payment_request_id UUID REFERENCES payment_requests(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_active ON subscription_history(is_active);

-- RLS Policies
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage payment requests" ON payment_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can manage subscription plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin'
    )
  );

CREATE POLICY "Admins can manage subscription history" ON subscription_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin'
    )
  );

-- Users can view their own payment requests and create new ones
CREATE POLICY "Users can view own payment requests" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view active subscription plans
CREATE POLICY "Users can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = true);

-- Users can view their own subscription history
CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- Seed initial subscription plans
INSERT INTO subscription_plans (name, display_name, price, currency, duration_days, features, is_active)
VALUES 
  ('premium_monthly', 'Premium Monthly', 299.00, 'BDT', 30, 
   '["Unlimited exams", "AI question generator", "Detailed analytics", "Priority support", "No ads"]'::jsonb, 
   true),
  ('premium_yearly', 'Premium Yearly', 2999.00, 'BDT', 365, 
   '["Unlimited exams", "AI question generator", "Detailed analytics", "Priority support", "No ads", "2 months free"]'::jsonb, 
   true)
ON CONFLICT (name) DO NOTHING;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
