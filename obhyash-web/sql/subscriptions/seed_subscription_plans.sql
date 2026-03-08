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
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  color_theme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remove all old plans for a clean slate
DELETE FROM subscription_plans WHERE name IN ('Basic', 'Monthly', 'Quarterly', 'free', 'exam_ready', 'pro', 'session');

-- Insert the 4 launch plans.
-- NOTE: All features are available to everyone during the launch window.
--       Paywall enforcement is not active yet -- these plans are display-only.
INSERT INTO subscription_plans (display_name, name, price, duration_days, features, is_popular, color_theme) VALUES
(
  'ফ্রি (Free)',
  'free',
  0,
  36500,
  '["প্রতিদিন ১টি ফ্রি এক্সাম","বেসিক লিডারবোর্ড","সীমিত প্রশ্ন ব্যাংক","বেসিক পারফরম্যান্স ট্র্যাকিং"]'::jsonb,
  false,
  'border-neutral-200'
),
(
  'এক্সাম রেডি',
  'exam_ready',
  149,
  30,
  '["আনলিমিটেড মক এক্সাম","আনলিমিটেড OMR স্ক্যান","AI ব্যাখ্যাসহ সমাধান","অ্যাডভান্সড এনালাইসিস","বিজ্ঞাপনমুক্ত অভিজ্ঞতা"]'::jsonb,
  false,
  'border-indigo-500'
),
(
  'প্রো',
  'pro',
  349,
  90,
  '["এক্সাম রেডির সব সুবিধা","৩ মাসে ২৮% সাশ্রয়","বিষয়ভিত্তিক দুর্বলতা রিপোর্ট","প্রায়োরিটি কাস্টমার সাপোর্ট","নতুন ফিচারে আর্লি এক্সেস"]'::jsonb,
  true,
  'border-rose-500'
),
(
  'সেশন (Annual)',
  'session',
  599,
  365,
  '["প্রো প্ল্যানের সব সুবিধা","পুরো পরীক্ষার সেশনব্যাপী এক্সেস","৫৭% সাশ্রয় (সর্বোচ্চ ছাড়)","এক্সক্লুসিভ স্টাডি রিসোর্স","প্রিমিয়াম ব্যাজ ও প্রোফাইল"]'::jsonb,
  false,
  'border-emerald-500'
);