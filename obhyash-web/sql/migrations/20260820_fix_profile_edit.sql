-- ==============================================================================
-- Migration: 20260820_fix_profile_edit.sql
-- Description: Fixes profile edit validation in triggers and RLS policies
--              so students can smoothly update name, institute, address, etc.
-- ==============================================================================

-- 1. Ensure RLS policies on public.users allow both UPDATE and INSERT (upsert support)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. Refined Profile Edit Trigger that preserves locked fields without throwing hard exceptions
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
  IF OLD.batch IS NOT NULL AND TRIM(OLD.batch) != '' 
     AND NEW.batch IS NOT NULL AND TRIM(NEW.batch) != ''
     AND NEW.batch IS DISTINCT FROM OLD.batch THEN
    IF COALESCE(OLD.batch_change_count, 0) >= 1 THEN
      -- Keep old batch safely
      NEW.batch := OLD.batch;
    ELSE
      NEW.batch_change_count := COALESCE(OLD.batch_change_count, 0) + 1;
    END IF;
  END IF;

  -- C. SSC Information Lock: Once verified and saved, preserve OLD values silently
  IF OLD.ssc_roll IS NOT NULL AND TRIM(OLD.ssc_roll) != '' THEN
    NEW.ssc_roll := OLD.ssc_roll;
    NEW.ssc_reg := OLD.ssc_reg;
    NEW.ssc_board := OLD.ssc_board;
    NEW.ssc_passing_year := OLD.ssc_passing_year;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_edit_rules ON public.users;
CREATE TRIGGER trg_enforce_profile_edit_rules
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_edit_rules();
