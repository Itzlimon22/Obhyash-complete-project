-- ============================================================================
-- MIGRATION: Unlock Batch Edit Restriction (Allow Unrestricted Batch Changes)
-- DESCRIPTION:
--   Removes the 1-time batch change restriction in enforce_profile_edit_rules()
--   so students can change their batch freely without getting blocked.
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

  -- B. Batch Edit: UNRESTRICTED FOR NOW
  -- Users can change their batch freely as needed.
  IF OLD.batch IS DISTINCT FROM NEW.batch THEN
    NEW.batch_change_count := COALESCE(OLD.batch_change_count, 0) + 1;
  END IF;

  -- C. SSC Information: Unlocked (students can edit anytime freely)

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_edit_rules ON public.users;
CREATE TRIGGER trg_enforce_profile_edit_rules
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_edit_rules();
