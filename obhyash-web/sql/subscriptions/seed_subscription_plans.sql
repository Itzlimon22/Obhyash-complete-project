-- Add columns if they don't exist (Schema Migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'is_popular') THEN
        ALTER TABLE subscription_plans ADD COLUMN is_popular BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'color_theme') THEN
        ALTER TABLE subscription_plans ADD COLUMN color_theme TEXT DEFAULT 'border-neutral-200';
    END IF;
END $$;

-- Now ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BDT',
  duration_days INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb, -- Adjusted to match existing schema as JSONB
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  color_theme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delete existing default plans to ensure clean slate and avoid duplicates
DELETE FROM subscription_plans WHERE name IN ('Basic', 'Monthly', 'Quarterly');

-- Insert the 3 required plans with JSONB array casting
INSERT INTO subscription_plans (display_name, name, price, duration_days, features, is_popular, color_theme) VALUES
(
  'বেসিক (Free)', 
  'Basic', 
  0, 
  36500, 
  to_jsonb(ARRAY['প্রতিদিন ১টি ফ্রি এক্সাম', 'লিডারবোর্ড এক্সেস', 'বেসিক এনালাইসিস', 'লিমিটেড প্রশ্ন ব্যাংক']), 
  false, 
  'border-neutral-200'
),
(
  'মাসিক (Monthly)', 
  'Monthly', 
  149, 
  30, 
  to_jsonb(ARRAY['আনলিমিটেড এক্সাম', 'আনলিমিটেড OMR স্ক্যান', 'AI ব্যাখ্যাসহ সমাধান', 'অ্যাডভান্সড এনালাইসিস', 'বিজ্ঞাপনমুক্ত অভিজ্ঞতা']), 
  true, 
  'border-indigo-500'
),
(
  'ত্রৈমাসিক (Quarterly)', 
  'Quarterly', 
  299, 
  90, 
  to_jsonb(ARRAY['মাসিক প্ল্যানের সব সুবিধা', '৩৩% সাশ্রয় (বিশাল ছাড়)', 'অগ্রাধিকার সাপোর্ট', 'নতুন ফিচারে আর্লি এক্সেস']), 
  false, 
  'border-rose-500'
);
