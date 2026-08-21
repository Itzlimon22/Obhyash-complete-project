-- ============================================================================
-- MIGRATION: Unlock SSC Information Profile Edit (Allow Multiple Edits)
-- DESCRIPTION:
--   Removes the lock on ssc_roll, ssc_reg, ssc_board, and ssc_passing_year
--   in the enforce_profile_edit_rules trigger so students can edit and correct
--   their SSC examination details freely at any time.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_profile_edit_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- A. Protect Critical System Fields for non-service / student updates
  IF (auth.jwt() ->> 'role') != 'service_role' THEN
    -- Status cannot be self-modified
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.status := OLD.status;
    END IF;
    
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

  -- C. SSC Information: Now completely UNLOCKED (students can edit anytime freely)
  -- NEW.ssc_roll, NEW.ssc_reg, NEW.ssc_board, and NEW.ssc_passing_year are preserved as submitted.

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_edit_rules ON public.users;
CREATE TRIGGER trg_enforce_profile_edit_rules
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_edit_rules();
