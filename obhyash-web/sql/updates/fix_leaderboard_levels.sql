-- ==============================================================================
-- FIX: LEADERBOARD LEVEL CONSISTENCY
-- ==============================================================================
-- Problem: 'level' column in 'users' table is not always in sync with 'xp'.
-- Solution: 
-- 1. Create a function to calculate level from XP (Single Source of Truth)
-- 2. Create a trigger to AUTO-UPDATE level whenever XP changes.
-- 3. Backfill existing users to ensure current data is correct.
-- ==============================================================================

-- 1. Function to calculate level from XP
-- logic matches frontend (lib/utils.ts)
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp bigint)
RETURNS text AS $$
BEGIN
  IF xp >= 5000 THEN RETURN 'Legend';
  ELSIF xp >= 3500 THEN RETURN 'Titan';
  ELSIF xp >= 2000 THEN RETURN 'Warrior';
  ELSIF xp >= 800 THEN RETURN 'Scout';
  ELSE RETURN 'Rookie';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Trigger Function
CREATE OR REPLACE FUNCTION update_user_level_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically calculate level based on new XP value
  -- COALESCE ensures we handle nulls gracefully (treating as 0)
  NEW.level := calculate_level_from_xp(COALESCE(NEW.xp, 0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
-- Drop first to allow re-running this script safely
DROP TRIGGER IF EXISTS trg_update_user_level ON public.users;

CREATE TRIGGER trg_update_user_level
BEFORE INSERT OR UPDATE OF xp ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_user_level_trigger();

-- 4. Backfill/Fix Existing Data
-- Immediately fix any users who have incorrect levels right now
UPDATE public.users
SET level = calculate_level_from_xp(COALESCE(xp, 0));

-- 5. Verification
SELECT 
  id, name, xp, level, calculate_level_from_xp(xp) as calculated_level 
FROM public.users 
WHERE level != calculate_level_from_xp(COALESCE(xp, 0))
LIMIT 10;
