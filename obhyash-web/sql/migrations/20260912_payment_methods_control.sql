-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Granular Payment Methods Control via app_config
-- Allows toggling Automatic, Manual, and Google Play In-App Purchase 
-- directly from Supabase database / Admin Panel without needing app updates.
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Add granular payment method switches to public.app_config
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS payment_auto_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS payment_manual_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS payment_google_play_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS manual_payment_merchant_number TEXT DEFAULT '01749591456';

ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS reviewer_emails TEXT DEFAULT 'tester@obhyash.com,review@obhyash.com,reviewer@obhyash.com,google@obhyash.com';

-- 2. Update existing global_config row with defaults
UPDATE public.app_config
SET 
  payment_auto_enabled = COALESCE(payment_auto_enabled, TRUE),
  payment_manual_enabled = COALESCE(payment_manual_enabled, TRUE),
  payment_google_play_enabled = COALESCE(payment_google_play_enabled, TRUE),
  manual_payment_merchant_number = COALESCE(manual_payment_merchant_number, '01749591456'),
  reviewer_emails = COALESCE(reviewer_emails, 'tester@obhyash.com,review@obhyash.com,reviewer@obhyash.com,google@obhyash.com')
WHERE id = 'global_config';

-- 3. Notify comment
COMMENT ON COLUMN public.app_config.payment_auto_enabled IS 'Controls visibility of UddoktaPay (bKash/Nagad/Cards) instant auto payment';
COMMENT ON COLUMN public.app_config.payment_manual_enabled IS 'Controls visibility of bKash/Nagad Send Money manual TrxID verification';
COMMENT ON COLUMN public.app_config.payment_google_play_enabled IS 'Controls visibility of Google Play In-App Purchase billing';
COMMENT ON COLUMN public.app_config.manual_payment_merchant_number IS 'Official bKash/Nagad merchant number for manual Send Money';
COMMENT ON COLUMN public.app_config.reviewer_emails IS 'Comma-separated emails of Google Play testers/reviewers who will ALWAYS only see Google Play Billing';
