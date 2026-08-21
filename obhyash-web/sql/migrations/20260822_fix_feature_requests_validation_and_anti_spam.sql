-- ============================================================================
-- MIGRATION: Fix Feature Requests Validation, RLS & Anti-Spam Rules
-- DESCRIPTION:
--   1. Calibrates anti-spam lengths to match real student submissions (min 3 chars title, min 6 chars description).
--   2. Reduces cooldown from 3 minutes to 45 seconds for smooth UX.
--   3. Ensures RLS policies allow seamless INSERT and SELECT for authenticated users.
-- ============================================================================

-- 1. Create table if not exists with correct schema
CREATE TABLE IF NOT EXISTS public.app_feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Exam & Practice', 'Analytics & Tracking', 'Study Tools', 'UI & Theme', 'Other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review', 'Planned', 'In Progress', 'Completed', 'Declined')),
    admin_feedback TEXT,
    upvotes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_feature_requests ENABLE ROW LEVEL SECURITY;

-- Drop and recreate robust RLS policies
DROP POLICY IF EXISTS "Users can create their own feature requests" ON public.app_feature_requests;
CREATE POLICY "Users can create their own feature requests" 
ON public.app_feature_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view feature requests" ON public.app_feature_requests;
CREATE POLICY "Users can view feature requests" 
ON public.app_feature_requests FOR SELECT 
USING (auth.uid() = user_id OR status IN ('Planned', 'In Progress', 'Completed', 'Under Review'));

-- 2. Enhanced Anti-Spam Trigger Function
CREATE OR REPLACE FUNCTION public.check_feature_request_anti_spam()
RETURNS TRIGGER AS $$
DECLARE
    v_pending_count INT;
    v_recent_count INT;
    v_last_submitted_at TIMESTAMPTZ;
    v_duplicate_exists BOOLEAN;
    v_title_len INT;
    v_desc_len INT;
BEGIN
    v_title_len := LENGTH(TRIM(NEW.title));
    v_desc_len := LENGTH(TRIM(NEW.description));

    -- Rule 1: Min & Max Length check (Allow concise titles e.g. "ভুল", "ডার্ক মোড")
    IF v_title_len < 2 THEN
        RAISE EXCEPTION 'ফিচারের শিরোনাম কমপক্ষে ২ অক্ষর হতে হবে।';
    END IF;
    IF v_desc_len < 4 THEN
        RAISE EXCEPTION 'ফিচারের বিবরণ আরও একটু বিস্তারিত লেখো।';
    END IF;
    IF v_desc_len > 2000 THEN
        RAISE EXCEPTION 'ফিচারের বিবরণ সর্বোচ্চ ২০০০ অক্ষরের মধ্যে হতে হবে।';
    END IF;

    -- Rule 2: Cooldown check (45 seconds)
    SELECT created_at INTO v_last_submitted_at
    FROM public.app_feature_requests
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_submitted_at IS NOT NULL AND v_last_submitted_at > NOW() - INTERVAL '45 seconds' THEN
        RAISE EXCEPTION 'অনুগ্রহ করে পরবর্তী ফিচার প্রস্তাব পাঠানোর জন্য ৪৫ সেকেন্ড অপেক্ষা করুন।';
    END IF;

    -- Rule 3: Daily limit check (Max 15 submissions in last 24 hours)
    SELECT COUNT(*) INTO v_recent_count
    FROM public.app_feature_requests
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF v_recent_count >= 15 THEN
        RAISE EXCEPTION 'আজকের জন্য আপনার ফিচার প্রস্তাবের দৈনিক সীমা পূর্ণ হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।';
    END IF;

    -- Rule 4: Duplicate title/text detection in last 24 hours
    SELECT EXISTS (
        SELECT 1
        FROM public.app_feature_requests
        WHERE user_id = NEW.user_id
          AND LOWER(TRIM(title)) = LOWER(TRIM(NEW.title))
          AND LOWER(TRIM(description)) = LOWER(TRIM(NEW.description))
          AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO v_duplicate_exists;

    IF v_duplicate_exists THEN
        RAISE EXCEPTION 'আপনি ইতিপূর্বে হুবহু একই ফিচারের প্রস্তাব পাঠিয়েছেন।';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reattach trigger
DROP TRIGGER IF EXISTS trg_check_feature_request_anti_spam ON public.app_feature_requests;
CREATE TRIGGER trg_check_feature_request_anti_spam
BEFORE INSERT ON public.app_feature_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_feature_request_anti_spam();
