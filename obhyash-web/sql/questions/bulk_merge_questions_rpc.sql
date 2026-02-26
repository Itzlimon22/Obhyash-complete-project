-- =====================================================
-- Migration: Create bulk_merge_questions RPC
-- Handles atomic bulk inserts with duplicate detection via fingerprint
-- =====================================================

CREATE OR REPLACE FUNCTION bulk_merge_questions(
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
BEGIN
  FOR i IN 1..v_total LOOP
    v_question := p_questions[i];
    v_fingerprint := v_question->>'fingerprint';

    BEGIN
      -- Attempt insert
      INSERT INTO questions (
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
        ARRAY(SELECT jsonb_array_elements_text(v_question->'institutes')),
        ARRAY(SELECT (jsonb_array_elements(v_question->'years'))::integer),
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
