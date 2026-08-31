-- ============================================================================
-- PHASE F: OPTIMIZED BULK QUESTION MERGE RPC FOR PARTITIONED DATABASE
--
-- Features:
--   1. Full support for `passage` (উদ্দীপক), `stream_id`, `division_id`
--   2. Safe duplicate detection via SHA-256 fingerprint
--   3. Compatible with PostgreSQL declarative partitioned tables
-- ============================================================================

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
BEGIN
  IF p_total IS NULL OR p_total = 0 THEN
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
