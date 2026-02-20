-- ==========================================
-- Smart Question System: Fetch RPC
-- Prioritizes: Unused -> Mistaken -> Random
-- ==========================================

CREATE OR REPLACE FUNCTION get_smart_exam_questions(
  p_user_id UUID,
  p_subject TEXT,         -- Subject ID (UUID)
  p_limit INT,
  p_chapters TEXT[] DEFAULT NULL,
  p_topics TEXT[] DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_exam_types TEXT[] DEFAULT NULL,
  p_subject_name TEXT DEFAULT NULL -- New parameter for Dual-Match
) RETURNS SETOF questions AS $$
DECLARE
  v_needed INT := p_limit;
  v_count INT;
  v_picked_ids UUID[] := '{}';
  v_rec questions%ROWTYPE;
BEGIN
  -- ---------------------------------------------------------
  -- 1. UNUSED QUESTIONS (Priority: Highest)
  -- ---------------------------------------------------------
  FOR v_rec IN 
    SELECT q.*
    FROM questions q
    LEFT JOIN user_question_analytics uqa 
      ON q.id = uqa.question_id AND uqa.user_id = p_user_id
    WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
      AND uqa.question_id IS NULL
      AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
      AND (p_topics IS NULL OR q.topic = ANY(p_topics))
      AND (p_difficulty IS NULL OR p_difficulty = 'Mixed' OR q.difficulty = p_difficulty)
      AND (p_exam_types IS NULL OR 'Mixed' = ANY(p_exam_types) OR q.exam_type = ANY(p_exam_types))
    ORDER BY random()
    LIMIT v_needed
  LOOP
    v_picked_ids := array_append(v_picked_ids, v_rec.id);
    v_needed := v_needed - 1;
    RETURN NEXT v_rec;
  END LOOP;

  -- ---------------------------------------------------------
  -- 2. MISTAKEN QUESTIONS (Priority: Medium)
  -- ---------------------------------------------------------
  IF v_needed > 0 THEN
    FOR v_rec IN 
      SELECT q.*
      FROM questions q
      JOIN user_question_analytics uqa 
        ON q.id = uqa.question_id AND uqa.user_id = p_user_id
      WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
        AND uqa.is_mistaken = true
        AND q.id != ALL(v_picked_ids) -- PREVENT DUPLICATES
        AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
        AND (p_topics IS NULL OR q.topic = ANY(p_topics))
        AND (p_difficulty IS NULL OR p_difficulty = 'Mixed' OR q.difficulty = p_difficulty)
        AND (p_exam_types IS NULL OR 'Mixed' = ANY(p_exam_types) OR q.exam_type = ANY(p_exam_types))
      ORDER BY uqa.last_attempted_at ASC
      LIMIT v_needed
    LOOP
      v_picked_ids := array_append(v_picked_ids, v_rec.id);
      v_needed := v_needed - 1;
      RETURN NEXT v_rec;
    END LOOP;
  END IF;

  -- ---------------------------------------------------------
  -- 3. RANDOM FILL (Priority: Lowest)
  -- ---------------------------------------------------------
  IF v_needed > 0 THEN
    FOR v_rec IN 
      SELECT q.*
      FROM questions q
      WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
        AND q.id != ALL(v_picked_ids) -- PREVENT DUPLICATES
        AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
        AND (p_topics IS NULL OR q.topic = ANY(p_topics))
        AND (p_difficulty IS NULL OR p_difficulty = 'Mixed' OR q.difficulty = p_difficulty)
        AND (p_exam_types IS NULL OR 'Mixed' = ANY(p_exam_types) OR q.exam_type = ANY(p_exam_types))
      ORDER BY random()
      LIMIT v_needed
    LOOP
      v_picked_ids := array_append(v_picked_ids, v_rec.id);
      v_needed := v_needed - 1;
      RETURN NEXT v_rec;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;
