-- Migration: Fix chapter_id and topic_id column types 
-- Change from UUID to TEXT to support custom string IDs from hsc.ts (e.g., 'ban1_prose_1')

ALTER TABLE public.questions 
ALTER COLUMN chapter_id TYPE TEXT USING chapter_id::text,
ALTER COLUMN topic_id TYPE TEXT USING topic_id::text;

COMMENT ON COLUMN public.questions.chapter_id IS 'Chapter ID from hsc.ts (custom string)';
COMMENT ON COLUMN public.questions.topic_id IS 'Topic ID from hsc.ts (custom string)';

-- Part C: Fixed Bulk Merge RPC (TEXT compatible chapter_id/topic_id)
CREATE OR REPLACE FUNCTION bulk_merge_questions_v2(
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
BEGIN
  -- If p_job_id is provided, mark it as Processing
  IF p_job_id IS NOT NULL THEN
    UPDATE bulk_upload_jobs SET total_rows = v_total, status = 'Processing' WHERE id = p_job_id;
  END IF;

  FOR i IN 1..v_total LOOP
    v_question := p_questions[i];
    v_fingerprint := v_question->>'fingerprint';

    BEGIN
      INSERT INTO questions (
        question, options, correct_answer_indices, explanation, 
        type, difficulty, subject, chapter, topic, 
        subject_id, chapter_id, topic_id,
        stream, division, section, exam_type, 
        institutes, years, status, author, author_name, tags, 
        image_url, option_images, explanation_image_url,
        fingerprint, random_id
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
        v_question->>'subject_id',
        v_question->>'chapter_id', -- No more UUID cast
        v_question->>'topic_id',   -- No more UUID cast
        v_question->>'stream',
        COALESCE(v_question->>'division', v_question->>'section'),
        v_question->>'section',
        COALESCE(v_question->>'exam_type', 'Academic'),
        ARRAY(SELECT jsonb_array_elements_text(v_question->'institutes')),
        ARRAY(SELECT (jsonb_array_elements(v_question->'years'))::integer),
        COALESCE(v_question->>'status', 'Pending'),
        COALESCE(v_question->>'author', 'Admin'),
        COALESCE(v_question->>'author_name', v_question->>'author', 'Admin'),
        ARRAY(SELECT jsonb_array_elements_text(v_question->'tags')),
        v_question->>'image_url',
        ARRAY(SELECT jsonb_array_elements_text(v_question->'option_images')),
        v_question->>'explanation_image_url',
        v_fingerprint,
        COALESCE((v_question->>'random_id')::double precision, random())
      )
      ON CONFLICT (fingerprint) DO NOTHING;

      IF FOUND THEN
        v_inserted := v_inserted + 1;
      ELSE
        v_duplicates := v_duplicates + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_error_details := array_append(v_error_details, 'Row ' || i || ': ' || SQLERRM);
    END;

    -- Periodically update progress if job exists
    IF p_job_id IS NOT NULL AND (i % 20 = 0 OR i = v_total) THEN
        UPDATE bulk_upload_jobs 
        SET 
            processed_rows = i,
            inserted_rows = v_inserted,
            duplicate_rows = v_duplicates,
            error_rows = v_errors,
            updated_at = NOW()
        WHERE id = p_job_id;
    END IF;
  END LOOP;

  -- Final job update
  IF p_job_id IS NOT NULL THEN
    UPDATE bulk_upload_jobs 
    SET 
        status = 'Completed',
        processed_rows = v_total,
        inserted_rows = v_inserted,
        duplicate_rows = v_duplicates,
        error_rows = v_errors,
        errors = to_jsonb(v_error_details),
        updated_at = NOW()
    WHERE id = p_job_id;
  END IF;

  RETURN jsonb_build_object(
    'total', v_total,
    'inserted', v_inserted,
    'duplicates', v_duplicates,
    'errors', v_errors,
    'error_details', v_error_details
  );
END;
$$;
