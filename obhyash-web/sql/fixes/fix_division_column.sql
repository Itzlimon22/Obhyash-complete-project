-- Fix Division Column (Migration)
-- Copies data from 'section' column to 'division' column if division is empty

UPDATE public.questions
SET division = section
WHERE (division IS NULL OR division = '')
  AND (section IS NOT NULL AND section != '');

-- Optional: If you want to clear the old 'section' column after verification:
-- UPDATE public.questions SET section = NULL;
-- (Commented out for safety, user can run manually if verified)
