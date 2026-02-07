-- =====================================================
-- Populate Subject Groups for Filtering
-- =====================================================

-- 1. Set Science Groups
UPDATE public.subjects
SET "division" = 'Science'
WHERE id IN (
  'hsc_physics_1', 'hsc_physics_2',
  'hsc_chemistry_1', 'hsc_chemistry_2',
  'hsc_math_1', 'hsc_math_2',
  'hsc_biology_1', 'hsc_biology_2',
  'hsc_higher_math_1', 'hsc_higher_math_2',
  'hsc_math_general',
  'hsc_mental_ability',
  'hsc_statistics' -- Often science/general
);

-- 2. Set Humanities Groups (Arts)
UPDATE public.subjects
SET "division" = 'Humanities'
WHERE id IN (
  'hsc_civics', 'hsc_civics_1', 'hsc_civics_2',
  'hsc_economics', 'hsc_economics_1', 'hsc_economics_2',
  'hsc_sociology', 'hsc_sociology_1', 'hsc_sociology_2',
  'hsc_social_work', 'hsc_social_work_1', 'hsc_social_work_2',
  'hsc_history', 'hsc_islamic_history',
  'hsc_logic', 'hsc_geography'
);

-- 3. Set Business Studies Groups (Commerce)
UPDATE public.subjects
SET "division" = 'Business Studies'
WHERE id IN (
  'hsc_accounting', 'hsc_accounting_1', 'hsc_accounting_2',
  'hsc_business_org', 'hsc_business_org_1', 'hsc_business_org_2',
  'hsc_finance', 'hsc_finance_1', 'hsc_finance_2',
  'hsc_marketing', 'hsc_marketing_1', 'hsc_marketing_2'
);

-- 4. Set General (Common) Groups
UPDATE public.subjects
SET "division" = 'General'
WHERE id IN (
  'hsc_bangla_1', 'hsc_bangla_2',
  'hsc_english_1', 'hsc_english_2',
  'hsc_ict'
);

-- Note: Any remaining subjects with NULL group will be treated as "All" or "Unfiltered" depending on logic.
