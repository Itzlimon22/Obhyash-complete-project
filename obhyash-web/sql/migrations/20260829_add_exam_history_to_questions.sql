-- ============================================================================
-- Migration: Add exam_history JSONB Column to Questions Table
-- Date: 2026-08-29
-- Description:
--   1. Adds `exam_history` JSONB column with schema:
--      [{"institute": "ঢাকা বোর্ড", "code": "DB", "year": 2022}, ...]
--   2. Creates high-performance GIN index for JSONB queries
--   3. Provides intelligent backfill function to convert existing `institutes`
--      and `years` arrays to structured `exam_history` objects with standard codes
--   4. Updates bulk merge RPC functions to support `exam_history`
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD COLUMN TO questions TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS exam_history JSONB DEFAULT '[]'::jsonb;

-- ----------------------------------------------------------------------------
-- 2. CREATE GIN INDEX FOR FAST JSONB FILTERING & SEARCH
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_exam_history_gin 
ON public.questions USING GIN (exam_history jsonb_path_ops);

COMMENT ON COLUMN public.questions.exam_history IS 
'Array of exam occurrences: [{"institute": "ঢাকা বোর্ড", "code": "DB", "year": 2022}]';

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTION: Convert Institute Name to Standard Short Code
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_institute_code(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_norm TEXT := TRIM(p_name);
BEGIN
  IF v_norm IS NULL OR v_norm = '' THEN
    RETURN '';
  END IF;

  -- Board Name Mapping
  IF v_norm ILIKE '%ঢাকা%' OR v_norm ILIKE '%dhaka%' THEN
    RETURN 'DB';
  ELSIF v_norm ILIKE '%রাজশাহী%' OR v_norm ILIKE '%rajshahi%' THEN
    RETURN 'RB';
  ELSIF v_norm ILIKE '%চট্টগ্রাম%' OR v_norm ILIKE '%chattogram%' OR v_norm ILIKE '%chittagong%' THEN
    RETURN 'CB';
  ELSIF v_norm ILIKE '%কুমিল্লা%' OR v_norm ILIKE '%cumilla%' OR v_norm ILIKE '%comilla%' THEN
    RETURN 'ComB';
  ELSIF v_norm ILIKE '%দিনাজপুর%' OR v_norm ILIKE '%dinajpur%' THEN
    RETURN 'DinB';
  ELSIF v_norm ILIKE '%যশোর%' OR v_norm ILIKE '%jashore%' OR v_norm ILIKE '%jessore%' THEN
    RETURN 'JB';
  ELSIF v_norm ILIKE '%সিলেট%' OR v_norm ILIKE '%sylhet%' THEN
    RETURN 'SB';
  ELSIF v_norm ILIKE '%বরিশাল%' OR v_norm ILIKE '%barishal%' OR v_norm ILIKE '%barisal%' THEN
    RETURN 'BB';
  ELSIF v_norm ILIKE '%ময়মনসিংহ%' OR v_norm ILIKE '%mymensingh%' THEN
    RETURN 'MB';
  ELSIF v_norm ILIKE '%মাদ্রাসা%' OR v_norm ILIKE '%madrasah%' OR v_norm ILIKE '%madrasa%' THEN
    RETURN 'MadB';
  ELSIF v_norm ILIKE '%কারিগরি%' OR v_norm ILIKE '%technical%' OR v_norm ILIKE '%bteb%' THEN
    RETURN 'BTEB';
  ELSIF v_norm ILIKE '%মেডিকেল%' OR v_norm ILIKE '%medical%' OR v_norm ILIKE '%mat%' THEN
    RETURN 'MAT';
  ELSIF v_norm ILIKE '%ডেন্টাল%' OR v_norm ILIKE '%dental%' OR v_norm ILIKE '%dat%' THEN
    RETURN 'DAT';
  ELSIF v_norm ILIKE '%বুয়েট%' OR v_norm ILIKE '%buet%' THEN
    RETURN 'BUET';
  ELSIF v_norm ILIKE '%ঢাবি%' OR v_norm ILIKE '%du%' THEN
    RETURN 'DU';
  ELSIF v_norm ILIKE '%রাবি%' OR v_norm ILIKE '%ru%' THEN
    RETURN 'RU';
  ELSIF v_norm ILIKE '%চবি%' OR v_norm ILIKE '%cu%' THEN
    RETURN 'CU';
  ELSIF v_norm ILIKE '%জাবি%' OR v_norm ILIKE '%ju%' THEN
    RETURN 'JU';
  ELSIF v_norm ILIKE '%জিএসটি%' OR v_norm ILIKE '%gst%' THEN
    RETURN 'GST';
  ELSIF v_norm ILIKE '%সকল বোর্ড%' OR v_norm ILIKE '%all board%' THEN
    RETURN 'AllB';
  ELSE
    -- Return cleaned uppercase initials or original text if short
    IF LENGTH(v_norm) <= 5 THEN
      RETURN UPPER(v_norm);
    ELSE
      RETURN v_norm;
    END IF;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. DATA MIGRATION & BACKFILL FUNCTION
--    Migrates existing `institutes` and `years` to `exam_history` JSONB
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.backfill_questions_exam_history()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_updated INTEGER := 0;
  v_rec RECORD;
  v_history JSONB;
  v_insts TEXT[];
  v_yrs INT[];
  v_num_insts INT;
  v_num_yrs INT;
  v_max_len INT;
  v_inst TEXT;
  v_yr INT;
  v_code TEXT;
BEGIN
  FOR v_rec IN 
    SELECT id, institutes, years, exam_history 
    FROM public.questions 
    WHERE (exam_history IS NULL OR exam_history = '[]'::jsonb)
      AND ((institutes IS NOT NULL AND array_length(institutes, 1) > 0)
        OR (years IS NOT NULL AND array_length(years, 1) > 0))
  LOOP
    v_count := v_count + 1;
    v_insts := COALESCE(v_rec.institutes, '{}'::TEXT[]);
    v_yrs := COALESCE(v_rec.years, '{}'::INT[]);
    v_num_insts := array_length(v_insts, 1);
    v_num_yrs := array_length(v_yrs, 1);
    v_history := '[]'::jsonb;

    IF v_num_insts IS NOT NULL AND v_num_insts > 0 THEN
      -- If both have items
      IF v_num_yrs IS NOT NULL AND v_num_yrs > 0 THEN
        IF v_num_insts = v_num_yrs THEN
          -- 1-to-1 match
          FOR i IN 1..v_num_insts LOOP
            v_inst := TRIM(v_insts[i]);
            v_yr := v_yrs[i];
            v_code := public.get_institute_code(v_inst);
            v_history := v_history || jsonb_build_object(
              'institute', v_inst,
              'code', v_code,
              'year', v_yr
            );
          END LOOP;
        ELSIF v_num_yrs = 1 THEN
          -- 1 year for all institutes
          FOR i IN 1..v_num_insts LOOP
            v_inst := TRIM(v_insts[i]);
            v_yr := v_yrs[1];
            v_code := public.get_institute_code(v_inst);
            v_history := v_history || jsonb_build_object(
              'institute', v_inst,
              'code', v_code,
              'year', v_yr
            );
          END LOOP;
        ELSIF v_num_insts = 1 THEN
          -- 1 institute across multiple years
          FOR i IN 1..v_num_yrs LOOP
            v_inst := TRIM(v_insts[1]);
            v_yr := v_yrs[i];
            v_code := public.get_institute_code(v_inst);
            v_history := v_history || jsonb_build_object(
              'institute', v_inst,
              'code', v_code,
              'year', v_yr
            );
          END LOOP;
        ELSE
          -- General fallback
          v_max_len := GREATEST(v_num_insts, v_num_yrs);
          FOR i IN 1..v_max_len LOOP
            v_inst := CASE WHEN i <= v_num_insts THEN TRIM(v_insts[i]) ELSE TRIM(v_insts[1]) END;
            v_yr := CASE WHEN i <= v_num_yrs THEN v_yrs[i] ELSE v_yrs[1] END;
            v_code := public.get_institute_code(v_inst);
            v_history := v_history || jsonb_build_object(
              'institute', v_inst,
              'code', v_code,
              'year', v_yr
            );
          END LOOP;
        END IF;
      ELSE
        -- Only institutes, no years
        FOR i IN 1..v_num_insts LOOP
          v_inst := TRIM(v_insts[i]);
          v_code := public.get_institute_code(v_inst);
          v_history := v_history || jsonb_build_object(
            'institute', v_inst,
            'code', v_code,
            'year', 0
          );
        END LOOP;
      END IF;
    ELSIF v_num_yrs IS NOT NULL AND v_num_yrs > 0 THEN
      -- Only years, no institutes
      FOR i IN 1..v_num_yrs LOOP
        v_yr := v_yrs[i];
        v_history := v_history || jsonb_build_object(
          'institute', '',
          'code', '',
          'year', v_yr
        );
      END LOOP;
    END IF;

    IF jsonb_array_length(v_history) > 0 THEN
      UPDATE public.questions
      SET exam_history = v_history
      WHERE id = v_rec.id;
      v_updated := v_updated + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'scanned_questions', v_count,
    'updated_questions', v_updated
  );
END;
$$;

-- Run backfill immediately for existing records
SELECT public.backfill_questions_exam_history();

-- ----------------------------------------------------------------------------
-- 5. UPDATED BULK MERGE RPC FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_merge_questions(
  p_questions JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question JSONB;
  v_total INTEGER := array_length(p_questions, 1);
  v_inserted INTEGER := 0;
  v_duplicates INTEGER := 0;
  v_errors INTEGER := 0;
  v_error_details TEXT[] := '{}';
  v_fingerprint TEXT;
  v_exam_history JSONB;
  v_institutes TEXT[];
  v_years INT[];
BEGIN
  FOR i IN 1..v_total LOOP
    v_question := p_questions[i];
    v_fingerprint := v_question->>'fingerprint';

    BEGIN
      -- Extract exam_history or fallback to empty array
      v_exam_history := COALESCE(v_question->'exam_history', '[]'::jsonb);

      -- Maintain backward compatibility for institutes and years arrays
      IF jsonb_array_length(v_exam_history) > 0 THEN
        SELECT 
          COALESCE(array_agg(elem->>'institute'), '{}'::TEXT[]),
          COALESCE(array_agg((elem->>'year')::integer), '{}'::INT[])
        INTO v_institutes, v_years
        FROM jsonb_array_elements(v_exam_history) AS elem;
      ELSE
        v_institutes := ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'institutes', '[]'::jsonb)));
        v_years := ARRAY(SELECT (jsonb_array_elements(COALESCE(v_question->'years', '[]'::jsonb)))::integer);
      END IF;

      -- Attempt insert
      INSERT INTO public.questions (
        question, 
        options, 
        correct_answer_indices, 
        explanation, 
        type, 
        difficulty, 
        subject, 
        chapter, 
        topic, 
        stream, 
        division, 
        section, 
        exam_type, 
        exam_history,
        institutes, 
        years, 
        status, 
        author, 
        tags, 
        image_url, 
        option_images, 
        explanation_image_url,
        fingerprint,
        random_id
      ) VALUES (
        v_question->>'question',
        ARRAY(SELECT jsonb_array_elements_text(v_question->'options')),
        ARRAY(SELECT (jsonb_array_elements(v_question->'correct_answer_indices'))::integer),
        v_question->>'explanation',
        COALESCE(v_question->>'type', 'MCQ'),
        COALESCE(v_question->>'difficulty', 'Medium'),
        v_question->>'subject',
        v_question->>'chapter',
        v_question->>'topic',
        v_question->>'stream',
        COALESCE(v_question->>'division', v_question->>'section'),
        v_question->>'section',
        COALESCE(v_question->>'exam_type', 'Academic'),
        v_exam_history,
        v_institutes,
        v_years,
        COALESCE(v_question->>'status', 'Pending'),
        COALESCE(v_question->>'author', 'Admin'),
        ARRAY(SELECT jsonb_array_elements_text(v_question->'tags')),
        v_question->>'image_url',
        ARRAY(SELECT jsonb_array_elements_text(v_question->'option_images')),
        v_question->>'explanation_image_url',
        v_fingerprint,
        COALESCE((v_question->>'random_id')::double precision, random())
      )
      ON CONFLICT (fingerprint) DO NOTHING;

      -- Check if row was actually inserted
      IF FOUND THEN
        v_inserted := v_inserted + 1;
      ELSE
        v_duplicates := v_duplicates + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_error_details := array_append(v_error_details, 'Row ' || i || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'total', v_total,
    'inserted', v_inserted,
    'duplicates', v_duplicates,
    'errors', v_errors,
    'error_details', v_error_details
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. UPDATED BULK MERGE V2 RPC FUNCTION (With stream_id / passage / jobs)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_merge_questions_v2(
  p_questions JSONB[],
  p_job_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question JSONB;
  v_total INTEGER := array_length(p_questions, 1);
  v_inserted INTEGER := 0;
  v_duplicates INTEGER := 0;
  v_errors INTEGER := 0;
  v_error_details TEXT[] := '{}';
  v_fingerprint TEXT;
  v_stream_id TEXT;
  v_subject_name TEXT;
  v_opts TEXT[];
  v_ans_indices INT[];
  v_exam_history JSONB;
  v_institutes TEXT[];
  v_years INT[];
BEGIN
  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('inserted', 0, 'duplicates', 0, 'errors', 0, 'error_details', '[]'::jsonb);
  END IF;

  -- If p_job_id is provided, mark it as Processing
  IF p_job_id IS NOT NULL THEN
    BEGIN
      UPDATE public.bulk_upload_jobs SET total_rows = v_total, status = 'Processing' WHERE id = p_job_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  FOR i IN 1..v_total LOOP
    v_question := p_questions[i];
    v_fingerprint := v_question->>'fingerprint';
    v_subject_name := v_question->>'subject';
    
    -- Normalize stream_id
    v_stream_id := COALESCE(
      v_question->>'stream_id',
      v_question->>'stream',
      CASE 
        WHEN v_subject_name ~* 'HSC' THEN 'HSC'
        WHEN v_subject_name ~* 'SSC' THEN 'SSC'
        WHEN v_subject_name ~* 'Admission' THEN 'ADMISSION'
        ELSE 'HSC'
      END
    );

    BEGIN
      -- Extract options array safely
      SELECT COALESCE(array_agg(x), '{}'::TEXT[])
      INTO v_opts
      FROM jsonb_array_elements_text(COALESCE(v_question->'options', '[]'::jsonb)) AS x;

      -- Extract correct answer indices safely
      SELECT COALESCE(array_agg(x::INT), '{0}'::INT[])
      INTO v_ans_indices
      FROM jsonb_array_elements(COALESCE(v_question->'correct_answer_indices', '[0]'::jsonb)) AS x;

      -- Extract exam_history or fallback
      v_exam_history := COALESCE(v_question->'exam_history', '[]'::jsonb);

      -- Maintain institutes & years backward compatibility
      IF jsonb_array_length(v_exam_history) > 0 THEN
        SELECT 
          COALESCE(array_agg(elem->>'institute'), '{}'::TEXT[]),
          COALESCE(array_agg((elem->>'year')::integer), '{}'::INT[])
        INTO v_institutes, v_years
        FROM jsonb_array_elements(v_exam_history) AS elem;
      ELSE
        v_institutes := COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'institutes', '[]'::jsonb))), '{}'::TEXT[]);
        v_years := COALESCE(ARRAY(SELECT (jsonb_array_elements(COALESCE(v_question->'years', '[]'::jsonb)))::integer), '{}'::INT[]);
      END IF;

      -- Check duplicate fingerprint before inserting
      IF v_fingerprint IS NOT NULL AND EXISTS (SELECT 1 FROM public.questions WHERE fingerprint = v_fingerprint) THEN
        v_duplicates := v_duplicates + 1;
      ELSE
        INSERT INTO public.questions (
          question, 
          passage,
          options, 
          correct_answer_indices, 
          correct_answer_index,
          explanation, 
          type, 
          difficulty, 
          subject, 
          chapter, 
          topic, 
          subject_id, 
          chapter_id, 
          topic_id,
          stream, 
          stream_id,
          division, 
          division_id,
          section, 
          exam_type, 
          exam_history,
          institutes, 
          years, 
          status, 
          author, 
          author_name, 
          tags, 
          image_url, 
          option_images, 
          explanation_image_url,
          fingerprint, 
          random_id
        ) VALUES (
          v_question->>'question',
          v_question->>'passage',
          v_opts,
          v_ans_indices,
          COALESCE(v_ans_indices[1], 0),
          v_question->>'explanation',
          COALESCE(v_question->>'type', 'MCQ'),
          COALESCE(v_question->>'difficulty', 'Medium'),
          v_subject_name,
          v_question->>'chapter',
          v_question->>'topic',
          v_question->>'subject_id',
          v_question->>'chapter_id',
          v_question->>'topic_id',
          COALESCE(v_question->>'stream', v_stream_id),
          v_stream_id,
          COALESCE(v_question->>'division', 'Science'),
          COALESCE(v_question->>'division_id', 'science'),
          v_question->>'section',
          COALESCE(v_question->>'exam_type', 'Academic'),
          v_exam_history,
          v_institutes,
          v_years,
          COALESCE(v_question->>'status', 'Approved'),
          COALESCE(v_question->>'author', 'Bulk Upload'),
          COALESCE(v_question->>'author_name', 'Bulk Upload'),
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'tags', '[]'::jsonb))), '{}'::TEXT[]),
          v_question->>'image_url',
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'option_images', '[]'::jsonb))), '{}'::TEXT[]),
          v_question->>'explanation_image_url',
          v_fingerprint,
          COALESCE((v_question->>'random_id')::double precision, random())
        );

        v_inserted := v_inserted + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_error_details := array_append(v_error_details, 'Row ' || i || ': ' || SQLERRM);
    END;

    -- Periodically update job progress
    IF p_job_id IS NOT NULL AND (i % 50 = 0 OR i = v_total) THEN
      BEGIN
        UPDATE public.bulk_upload_jobs 
        SET 
            processed_rows = i,
            inserted_rows = v_inserted,
            duplicate_rows = v_duplicates,
            error_rows = v_errors,
            updated_at = NOW()
        WHERE id = p_job_id;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END LOOP;

  -- Mark job completed
  IF p_job_id IS NOT NULL THEN
    BEGIN
      UPDATE public.bulk_upload_jobs 
      SET status = CASE WHEN v_errors = v_total THEN 'Failed' ELSE 'Completed' END,
          updated_at = NOW()
      WHERE id = p_job_id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'duplicates', v_duplicates,
    'errors', v_errors,
    'error_details', v_error_details
  );
END;
$$;
