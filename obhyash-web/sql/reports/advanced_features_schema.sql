-- Advanced Admin Features Database Schema
-- Phase 1: Core Tables

-- 1. User Activity Log
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  applicable_plans TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Promo Code Usage
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payment_request_id UUID REFERENCES payment_requests(id),
  discount_applied DECIMAL(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  payment_request_id UUID REFERENCES payment_requests(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'paid',
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Email Notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Subscription Reminders
CREATE TABLE IF NOT EXISTS subscription_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscription_history(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('7_days', '3_days', '1_day', 'expired')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_user ON promo_code_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment ON invoices(payment_request_id);

CREATE INDEX IF NOT EXISTS idx_email_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_created ON email_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reminders_subscription ON subscription_reminders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON subscription_reminders(reminder_type);

-- RLS Policies
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_reminders ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage activity logs" ON user_activity_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
  );

CREATE POLICY "Admins can manage promo codes" ON promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
  );

CREATE POLICY "Admins can view promo usage" ON promo_code_usage
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
  );

CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
  );

CREATE POLICY "Admins can manage emails" ON email_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
  );

CREATE POLICY "Admins can manage reminders" ON subscription_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'Admin')
  );

-- Users can view their own data
CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emails" ON email_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can use promo codes
CREATE POLICY "Users can view active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own promo usage" ON promo_code_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Function to auto-increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes 
  SET current_uses = current_uses + 1
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_promo_usage_trigger
  AFTER INSERT ON promo_code_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_promo_usage();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-%';
  
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- Update trigger for promo codes
CREATE TRIGGER update_promo_codes_updated_at 
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add promo_code_id to payment_requests table
ALTER TABLE payment_requests 
ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id),
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10,2) DEFAULT 0;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_activity_type,
    p_description,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;
