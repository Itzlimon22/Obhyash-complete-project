-- ==========================================
-- Smart Question System: Fetch RPC
-- Prioritizes: Unused -> Mistaken -> Random
--
-- Performance: Sections 1 & 3 use two-phase random sampling to avoid
-- full-table ORDER BY random() scans:
--   Phase A: Grab GREATEST(p_limit*4, 20) candidate IDs via fast index scan
--   Phase B: ORDER BY random() only on that small candidate set
-- Section 2 uses ORDER BY last_attempted_at which is index-efficient.
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
  v_needed     INT  := p_limit;
  v_oversample INT;
  v_picked_ids UUID[] := '{}';
  v_rec        questions%ROWTYPE;
BEGIN
  -- Oversample pool: index-scan this many IDs, then shuffle just them.
  -- Eliminates full-table random sort while preserving good randomness.
  v_oversample := GREATEST(p_limit * 4, 20);

  -- ---------------------------------------------------------
  -- 1. UNUSED QUESTIONS (Priority: Highest)
  --    Two-phase random: index-scan v_oversample candidates, then
  --    ORDER BY random() on only that small set.
  -- ---------------------------------------------------------
  FOR v_rec IN
    SELECT q.*
    FROM questions q
    WHERE q.id IN (
      SELECT cand.id
      FROM (
        SELECT q2.id
        FROM questions q2
        LEFT JOIN user_question_analytics uqa
          ON q2.id = uqa.question_id AND uqa.user_id = p_user_id
        WHERE (q2.subject = p_subject OR (p_subject_name IS NOT NULL AND q2.subject = p_subject_name))
          AND q2.status = 'Approved'
          AND uqa.question_id IS NULL
          AND (p_chapters IS NULL OR q2.chapter = ANY(p_chapters))
          AND (p_topics IS NULL OR q2.topic = ANY(p_topics))
          AND (p_difficulty IS NULL OR p_difficulty = 'Mixed' OR q2.difficulty = p_difficulty)
          AND (p_exam_types IS NULL OR 'Mixed' = ANY(p_exam_types) OR q2.exam_type = ANY(p_exam_types))
        LIMIT v_oversample          -- Fast index scan, no sort
      ) cand
      ORDER BY random()             -- Shuffle only the small candidate set
      LIMIT v_needed
    )
  LOOP
    v_picked_ids := array_append(v_picked_ids, v_rec.id);
    v_needed := v_needed - 1;
    RETURN NEXT v_rec;
  END LOOP;

  -- ---------------------------------------------------------
  -- 2. MISTAKEN QUESTIONS (Priority: Medium)
  --    ORDER BY last_attempted_at is index-efficient — no change needed.
  -- ---------------------------------------------------------
  IF v_needed > 0 THEN
    FOR v_rec IN
      SELECT q.*
      FROM questions q
      JOIN user_question_analytics uqa
        ON q.id = uqa.question_id AND uqa.user_id = p_user_id
      WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
        AND q.status = 'Approved'
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
  --    Same two-phase random approach as section 1.
  -- ---------------------------------------------------------
  IF v_needed > 0 THEN
    FOR v_rec IN
      SELECT q.*
      FROM questions q
      WHERE q.id IN (
        SELECT cand.id
        FROM (
          SELECT q2.id
          FROM questions q2
          WHERE (q2.subject = p_subject OR (p_subject_name IS NOT NULL AND q2.subject = p_subject_name))
            AND q2.status = 'Approved'
            AND q2.id != ALL(v_picked_ids) -- PREVENT DUPLICATES
            AND (p_chapters IS NULL OR q2.chapter = ANY(p_chapters))
            AND (p_topics IS NULL OR q2.topic = ANY(p_topics))
            AND (p_difficulty IS NULL OR p_difficulty = 'Mixed' OR q2.difficulty = p_difficulty)
            AND (p_exam_types IS NULL OR 'Mixed' = ANY(p_exam_types) OR q2.exam_type = ANY(p_exam_types))
          LIMIT v_oversample          -- Fast index scan, no sort
        ) cand
        ORDER BY random()             -- Shuffle only the small candidate set
        LIMIT v_needed
      )
    LOOP
      v_picked_ids := array_append(v_picked_ids, v_rec.id);
      v_needed := v_needed - 1;
      RETURN NEXT v_rec;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;
