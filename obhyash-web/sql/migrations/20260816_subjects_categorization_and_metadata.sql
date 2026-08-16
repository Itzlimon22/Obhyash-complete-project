-- ==============================================================================
-- MIGRATION: 3-Tier Categorization & Taxonomy for Subjects (SSC, HSC, Admission)
-- Compatible with Chorcha / Udvash / NCTB Academic Standard
-- ==============================================================================

-- Step 1: Add new taxonomy columns to 'subjects' table if they don't exist
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'HSC'; 
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS division TEXT DEFAULT 'General';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'core'; 
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS paper_number INT; 
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 100;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Step 2: Update / Insert HSC Compulsory Subjects (আবশ্যিক বিষয়সমূহ)
UPDATE public.subjects 
SET level = 'HSC', division = 'General', category = 'compulsory', paper_number = 1, sort_order = 10, icon = '📚' 
WHERE id ILIKE '%bangla%1%' OR id = 'hsc_bangla_1' OR id = 'bangla_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'General', category = 'compulsory', paper_number = 2, sort_order = 11, icon = '📚' 
WHERE id ILIKE '%bangla%2%' OR id = 'hsc_bangla_2' OR id = 'bangla_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'General', category = 'compulsory', paper_number = 1, sort_order = 20, icon = '📝' 
WHERE id ILIKE '%english%1%' OR id = 'hsc_english_1' OR id = 'english_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'General', category = 'compulsory', paper_number = 2, sort_order = 21, icon = '📝' 
WHERE id ILIKE '%english%2%' OR id = 'hsc_english_2' OR id = 'english_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'General', category = 'compulsory', paper_number = NULL, sort_order = 30, icon = '💻' 
WHERE id ILIKE '%ict%' OR id = 'hsc_ict';

-- Step 3: Update / Insert HSC Science Core & Electives (বিজ্ঞান বিভাগ)
UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'core', paper_number = 1, sort_order = 40, icon = '⚛️' 
WHERE id ILIKE '%physics%1%' OR id = 'hsc_physics_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'core', paper_number = 2, sort_order = 41, icon = '⚛️' 
WHERE id ILIKE '%physics%2%' OR id = 'hsc_physics_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'core', paper_number = 1, sort_order = 50, icon = '🧪' 
WHERE id ILIKE '%chemistry%1%' OR id = 'hsc_chemistry_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'core', paper_number = 2, sort_order = 51, icon = '🧪' 
WHERE id ILIKE '%chemistry%2%' OR id = 'hsc_chemistry_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'core', paper_number = 1, sort_order = 60, icon = '📐' 
WHERE (id ILIKE '%higher_math%1%' OR id ILIKE '%math%1%') AND id NOT ILIKE '%ssc%';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'core', paper_number = 2, sort_order = 61, icon = '📐' 
WHERE (id ILIKE '%higher_math%2%' OR id ILIKE '%math%2%') AND id NOT ILIKE '%ssc%';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'elective', paper_number = 1, sort_order = 70, icon = '🧬' 
WHERE id ILIKE '%biology%1%' OR id ILIKE '%botany%' OR id = 'hsc_biology_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'elective', paper_number = 2, sort_order = 71, icon = '🧬' 
WHERE id ILIKE '%biology%2%' OR id ILIKE '%zoology%' OR id = 'hsc_biology_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'elective', paper_number = 1, sort_order = 80, icon = '📊' 
WHERE id ILIKE '%statistics%1%';

UPDATE public.subjects 
SET level = 'HSC', division = 'Science', category = 'elective', paper_number = 2, sort_order = 81, icon = '📊' 
WHERE id ILIKE '%statistics%2%';

-- Step 4: Update / Insert HSC Business Studies Core & Electives (ব্যবসায় শিক্ষা)
UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'core', paper_number = 1, sort_order = 90, icon = '📊' 
WHERE id ILIKE '%accounting%1%' OR id = 'hsc_accounting_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'core', paper_number = 2, sort_order = 91, icon = '📊' 
WHERE id ILIKE '%accounting%2%' OR id = 'hsc_accounting_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'core', paper_number = 1, sort_order = 92, icon = '🏢' 
WHERE id ILIKE '%management%1%' OR id = 'hsc_management_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'core', paper_number = 2, sort_order = 93, icon = '🏢' 
WHERE id ILIKE '%management%2%' OR id = 'hsc_management_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'elective', paper_number = 1, sort_order = 94, icon = '💼' 
WHERE id ILIKE '%finance%1%' OR id = 'hsc_finance_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'elective', paper_number = 2, sort_order = 95, icon = '💼' 
WHERE id ILIKE '%finance%2%' OR id = 'hsc_finance_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'elective', paper_number = 1, sort_order = 96, icon = '📈' 
WHERE id ILIKE '%marketing%1%' OR id = 'hsc_marketing_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Business Studies', category = 'elective', paper_number = 2, sort_order = 97, icon = '📈' 
WHERE id ILIKE '%marketing%2%' OR id = 'hsc_marketing_2';

-- Step 5: Update / Insert HSC Humanities Core & Electives (মানবিক বিভাগ)
UPDATE public.subjects 
SET level = 'HSC', division = 'Humanities', category = 'core', paper_number = 1, sort_order = 100, icon = '📉' 
WHERE id ILIKE '%economics%1%' OR id = 'hsc_economics_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Humanities', category = 'core', paper_number = 2, sort_order = 101, icon = '📉' 
WHERE id ILIKE '%economics%2%' OR id = 'hsc_economics_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Humanities', category = 'core', paper_number = 1, sort_order = 102, icon = '🏛️' 
WHERE id ILIKE '%civics%1%' OR id = 'hsc_civics_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Humanities', category = 'core', paper_number = 2, sort_order = 103, icon = '🏛️' 
WHERE id ILIKE '%civics%2%' OR id = 'hsc_civics_2';

UPDATE public.subjects 
SET level = 'HSC', division = 'Humanities', category = 'elective', paper_number = 1, sort_order = 104, icon = '📜' 
WHERE id ILIKE '%history%1%' OR id = 'hsc_history_1';

UPDATE public.subjects 
SET level = 'HSC', division = 'Humanities', category = 'elective', paper_number = 2, sort_order = 105, icon = '📜' 
WHERE id ILIKE '%history%2%' OR id = 'hsc_history_2';

-- Step 6: Update / Insert SSC Subjects (এসএসসি)
UPDATE public.subjects 
SET level = 'SSC', division = 'General', category = 'compulsory', sort_order = 10, icon = '📚' 
WHERE id ILIKE 'ssc%bangla%';

UPDATE public.subjects 
SET level = 'SSC', division = 'General', category = 'compulsory', sort_order = 20, icon = '📝' 
WHERE id ILIKE 'ssc%english%';

UPDATE public.subjects 
SET level = 'SSC', division = 'General', category = 'compulsory', sort_order = 30, icon = '📐' 
WHERE id = 'ssc_math' OR id ILIKE 'ssc%general_math%';

UPDATE public.subjects 
SET level = 'SSC', division = 'General', category = 'compulsory', sort_order = 40, icon = '💻' 
WHERE id ILIKE 'ssc%ict%';

UPDATE public.subjects 
SET level = 'SSC', division = 'General', category = 'compulsory', sort_order = 45, icon = '🌍' 
WHERE id ILIKE 'ssc%bgs%' OR id ILIKE 'ssc%bangladesh%';

UPDATE public.subjects 
SET level = 'SSC', division = 'General', category = 'compulsory', sort_order = 48, icon = '📖' 
WHERE id ILIKE 'ssc%religion%';

UPDATE public.subjects 
SET level = 'SSC', division = 'Science', category = 'core', sort_order = 50, icon = '⚛️' 
WHERE id ILIKE 'ssc%physics%';

UPDATE public.subjects 
SET level = 'SSC', division = 'Science', category = 'core', sort_order = 60, icon = '🧪' 
WHERE id ILIKE 'ssc%chemistry%';

UPDATE public.subjects 
SET level = 'SSC', division = 'Science', category = 'core', sort_order = 70, icon = '📐' 
WHERE id ILIKE 'ssc%higher_math%';

UPDATE public.subjects 
SET level = 'SSC', division = 'Science', category = 'elective', sort_order = 80, icon = '🧬' 
WHERE id ILIKE 'ssc%biology%';

UPDATE public.subjects 
SET level = 'SSC', division = 'Business Studies', category = 'core', sort_order = 90, icon = '📊' 
WHERE id ILIKE 'ssc%accounting%' OR id ILIKE 'ssc%business%';

UPDATE public.subjects 
SET level = 'SSC', division = 'Humanities', category = 'core', sort_order = 100, icon = '🏛️' 
WHERE id ILIKE 'ssc%humanities%' OR id ILIKE 'ssc%geography%';

-- Step 7: Create helper index for lightning-fast personalized lookups
CREATE INDEX IF NOT EXISTS idx_subjects_level_division ON public.subjects (level, division, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_sort_order ON public.subjects (sort_order ASC);
