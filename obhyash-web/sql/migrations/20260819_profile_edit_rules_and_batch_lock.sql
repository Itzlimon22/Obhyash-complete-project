-- Migration: Profile Edit Rules, Batch 1-Time Edit Enforcement, and SSC Info Lock
-- Description: 
-- 1. Freely editable: Name, Avatar, Institute, Target, Optional Subject, Address, Daily Exams Goal
-- 2. Limited 1-time change: Batch (batch_change_count max 1). Once changed, permanently locked.
-- 3. One-time set & locked forever: SSC Roll, Reg, Board, Passing Year (once provided and saved, locked against tampering).
-- 4. Strictly Read-only: Student ID, XP, Level, Streak, Subscription Plan/Status, Role.

-- 1. Add batch_change_count column to users if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS batch_change_count INT DEFAULT 0;

-- 2. Create the before update trigger function to enforce profile integrity
CREATE OR REPLACE FUNCTION public.enforce_profile_edit_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- A. Protect System-Generated & Gamification Fields from manual manipulation by non-admins
  IF current_user NOT IN ('service_role', 'postgres') AND (OLD.role = 'student' OR OLD.role IS NULL) THEN
    -- Student ID cannot be changed once set
    IF OLD.student_id IS NOT NULL AND TRIM(OLD.student_id) != '' THEN
      NEW.student_id := OLD.student_id;
    END IF;
    
    -- Role cannot be escalated
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
  END IF;

  -- B. Batch 1-Time Edit Rule
  -- If user already had a batch, and is trying to change it to a different batch
  IF OLD.batch IS NOT NULL AND TRIM(OLD.batch) != '' AND NEW.batch IS DISTINCT FROM OLD.batch THEN
    IF COALESCE(OLD.batch_change_count, 0) >= 1 THEN
      RAISE EXCEPTION 'ব্যাচ ইতিমধ্যে ১ বার পরিবর্তন করা হয়েছে। আর পরিবর্তন করা যাবে না।';
    ELSE
      NEW.batch_change_count := COALESCE(OLD.batch_change_count, 0) + 1;
    END IF;
  END IF;

  -- C. SSC Information Permanent Lock Rule (Once set and saved, cannot be modified by student)
  IF OLD.ssc_roll IS NOT NULL AND TRIM(OLD.ssc_roll) != '' THEN
    IF NEW.ssc_roll IS DISTINCT FROM OLD.ssc_roll 
       OR NEW.ssc_reg IS DISTINCT FROM OLD.ssc_reg 
       OR NEW.ssc_board IS DISTINCT FROM OLD.ssc_board 
       OR NEW.ssc_passing_year IS DISTINCT FROM OLD.ssc_passing_year THEN
      IF current_user NOT IN ('service_role', 'postgres') THEN
        RAISE EXCEPTION 'যাচাইকৃত SSC তথ্য পরিবর্তনযোগ্য নয়। কোনো সংশোধনের প্রয়োজন হলে সাপোর্টে যোগাযোগ করো।';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Attach Trigger to public.users
DROP TRIGGER IF EXISTS trg_enforce_profile_edit_rules ON public.users;
CREATE TRIGGER trg_enforce_profile_edit_rules
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_edit_rules();

-- 4. Update public_profiles view
DROP VIEW IF EXISTS public.public_profiles CASCADE;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id,
    student_id,
    name,
    avatar_url,
    avatar_color,
    xp,
    level,
    exams_taken,
    streak,
    institute,
    batch,
    batch_change_count,
    stream,
    role,
    is_subscribed,
    COALESCE(subscription->>'plan', 'Free') AS plan
FROM public.users;

GRANT SELECT ON public.public_profiles TO authenticated, anon;
