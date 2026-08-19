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

-- Enable Row Level Security (RLS)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow everyone (authenticated & anon students) to view active subscription plans
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscription_plans' 
        AND policyname = 'Public can view active subscription plans'
    ) THEN
        CREATE POLICY "Public can view active subscription plans"
        ON subscription_plans FOR SELECT
        USING (is_active = true);
    END IF;
END $$;

-- Remove all old plans for a clean slate
DELETE FROM subscription_plans WHERE name IN ('Basic', 'Monthly', 'Quarterly', 'free', 'exam_ready', 'pro', 'session', 'annual', 'booster', 'top_rankers', 'master_pro');

-- Insert the 4 plans (Free + 1, 3, 6 Month Packages)
INSERT INTO subscription_plans (display_name, name, price, duration_days, features, is_popular, color_theme) VALUES
(
  'ফ্রি (Free)',
  'free',
  0,
  36500,
  '["প্রতিদিন ২টি ফ্রি এক্সাম","সর্বোচ্চ ৫০টি প্রশ্নের এক্সাম সেটআপ","সর্বোচ্চ ২৫টি বুকমার্ক সংরক্ষণ","লাইভ এক্সামে পূর্ণ এক্সেস","স্ট্রিক ও বেসিক লিডারবোর্ড"]'::jsonb,
  false,
  'border-neutral-200'
),
(
  'মাসিক প্ল্যান (১ মাস)',
  'exam_ready',
  149,
  30,
  '["আনলিমিটেড মক টেস্ট ও প্র্যাকটিস","প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান","৫০+ ও ১০০ প্রশ্নের ফুল মডেল টেস্ট","আনলিমিটেড বুকমার্ক ও রিভিশন লিস্ট","বিষয়ভিত্তিক দুর্বলতা ট্র্যাকার ও গ্রাফ","সম্পূর্ণ বিজ্ঞাপনমুক্ত প্রিমিয়াম অভিজ্ঞতা"]'::jsonb,
  false,
  'border-indigo-500'
),
(
  'এডমিশন প্যাক (৩ মাস)',
  'pro',
  349,
  90,
  '["আনলিমিটেড মক টেস্ট ও প্র্যাকটিস","প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান","৫০+ ও ১০০ প্রশ্নের ফুল মডেল টেস্ট","আনলিমিটেড বুকমার্ক ও রিভিশন লিস্ট","বিষয়ভিত্তিক দুর্বলতা ট্র্যাকার ও গ্রাফ","সম্পূর্ণ বিজ্ঞাপনমুক্ত প্রিমিয়াম অভিজ্ঞতা"]'::jsonb,
  true,
  'border-emerald-500'
),
(
  'ফুল সেশন প্যাক (৬ মাস)',
  'master_pro',
  599,
  180,
  '["আনলিমিটেড মক টেস্ট ও প্র্যাকটিস","প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান","৫০+ ও ১০০ প্রশ্নের ফুল মডেল টেস্ট","আনলিমিটেড বুকমার্ক ও রিভিশন লিস্ট","বিষয়ভিত্তিক দুর্বলতা ট্র্যাকার ও গ্রাফ","সম্পূর্ণ বিজ্ঞাপনমুক্ত প্রিমিয়াম অভিজ্ঞতা"]'::jsonb,
  false,
  'border-amber-500'
);