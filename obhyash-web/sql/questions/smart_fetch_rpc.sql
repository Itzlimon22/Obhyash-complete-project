-- ==========================================
-- Smart Question System: Fetch RPC
-- Prioritizes: Unused -> Mistaken -> Random
-- ==========================================

CREATE OR REPLACE FUNCTION get_smart_exam_questions(
  p_user_id UUID,
  p_subject TEXT,
  p_limit INT,
  p_chapters TEXT[] DEFAULT NULL,
  p_topics TEXT[] DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL
) RETURNS SETOF questions AS $$
DECLARE
  v_needed INT := p_limit;
  v_count INT;
BEGIN
  -- ---------------------------------------------------------
  -- 1. UNUSED QUESTIONS (Priority: Highest)
  -- Questions the user has never attempted (no record in analytics)
  -- ---------------------------------------------------------
  RETURN QUERY
  SELECT q.*
  FROM questions q
  LEFT JOIN user_question_analytics uqa 
    ON q.id = uqa.question_id AND uqa.user_id = p_user_id
  WHERE q.subject = p_subject
    AND uqa.question_id IS NULL -- Key: User has no record
    AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
    AND (p_topics IS NULL OR q.topic = ANY(p_topics))
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND q.random_id > random() -- Efficient O(log N) random seek
  ORDER BY q.random_id
  LIMIT v_needed;
  
  -- Calculate how many we got
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_needed := v_needed - v_count;

  -- ---------------------------------------------------------
  -- 2. MISTAKEN QUESTIONS (Priority: Medium)
  -- Questions the user previously got WRONG (is_mistaken = true)
  -- ---------------------------------------------------------
  IF v_needed > 0 THEN
    RETURN QUERY
    SELECT q.*
    FROM questions q
    JOIN user_question_analytics uqa 
      ON q.id = uqa.question_id AND uqa.user_id = p_user_id
    WHERE q.subject = p_subject
      AND uqa.is_mistaken = true
      AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
      AND (p_topics IS NULL OR q.topic = ANY(p_topics))
      AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    ORDER BY uqa.last_attempted_at ASC -- Spaced Repetition: Show oldest mistakes first
    LIMIT v_needed;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_needed := v_needed - v_count;
  END IF;

  -- ---------------------------------------------------------
  -- 3. RANDOM FILL (Priority: Lowest)
  -- If we still need questions (user mastered everything), pick random
  -- ---------------------------------------------------------
  IF v_needed > 0 THEN
    RETURN QUERY
    SELECT q.*
    FROM questions q
    WHERE q.subject = p_subject
      AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
      AND (p_topics IS NULL OR q.topic = ANY(p_topics))
      AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
      AND q.random_id > random() 
    ORDER BY q.random_id
    LIMIT v_needed;
  END IF;
END;
$$ LANGUAGE plpgsql;
