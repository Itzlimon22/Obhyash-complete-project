-- =====================================================
-- FIX: Standardize Division Names
-- Rename 'Commerce' -> 'Business Studies'
-- Rename 'Arts' -> 'Humanities'
-- =====================================================

-- 1. Update Subjects Table
UPDATE public.subjects
SET division = 'Business Studies'
WHERE division = 'Commerce';

UPDATE public.subjects
SET division = 'Humanities'
WHERE division = 'Arts';

-- 2. Update Users Table (where applicable)
UPDATE public.users
SET division = 'Business Studies'
WHERE division = 'Commerce';

UPDATE public.users
SET division = 'Humanities'
WHERE division = 'Arts';

-- 3. Update Questions Table (where applicable)
UPDATE public.questions
SET division = 'Business Studies'
WHERE division = 'Commerce';

UPDATE public.questions
SET division = 'Humanities'
WHERE division = 'Arts';

SELECT 'Migration Completed: Commerce -> Business Studies, Arts -> Humanities' as status;
