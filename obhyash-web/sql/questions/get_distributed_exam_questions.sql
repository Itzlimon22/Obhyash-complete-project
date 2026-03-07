-- ============================================================
-- Distributed Exam Question Fetcher
--
-- Guarantees proportional coverage across every
-- (chapter × difficulty × exam_type) cell the user's filters
-- produce, then top-fills any shortfall.
--
-- Priority per cell:  Unused → Mistaken → Random
-- Dedup:              Temp-table PK  (O(log N) vs array O(N²))
-- Distribution:       Equal quota per cell; remainder allocated
--                     to first cells; shortfall redistributed
--                     via a final top-up pass.
--
-- Call:  SELECT * FROM get_distributed_exam_questions(
--          p_user_id       := <uuid or NULL>,
--          p_subject       := '<subject-id>',
--          p_subject_name  := '<display-name>',
--          p_total         := 100,
--          p_chapters      := ARRAY['Physics','Chemistry'],
--          p_topics        := NULL,
--          p_difficulties  := ARRAY['Easy','Hard'],
--          p_exam_types    := NULL
--        );
--
-- Single DB round-trip — replaces N-parallel-bucket approach.
-- ============================================================

CREATE OR REPLACE FUNCTION get_distributed_exam_questions(
  p_user_id       UUID,                 -- NULL for anonymous / unauthenticated
  p_subject       TEXT,                 -- subject UUID / internal ID
  p_subject_name  TEXT   DEFAULT NULL,  -- display-name form (NFC primary)
  p_total         INT    DEFAULT 10,
  p_chapters      TEXT[] DEFAULT NULL,  -- NULL = all chapters
  p_topics        TEXT[] DEFAULT NULL,  -- NULL = all topics
  p_difficulties  TEXT[] DEFAULT NULL,  -- NULL = all difficulties
  p_exam_types    TEXT[] DEFAULT NULL   -- NULL = all exam types
) RETURNS SETOF questions AS $$
DECLARE
  v_cell          RECORD;
  v_q             questions%ROWTYPE;
  v_cell_count    INT;
  v_quota         INT;
  v_remainder     INT;
  v_cell_idx      INT  := 0;
  v_needed        INT;
  v_added         INT;
  v_fetched_total INT  := 0;
  v_oversample    INT;
BEGIN
  -- ── Dedup table: O(log N) NOT EXISTS via PK index ──────────────────────────
  -- ON COMMIT DROP cleans up when the RPC transaction ends.
  -- EXCEPTION block safely handles re-use in the same session.
  BEGIN
    CREATE TEMP TABLE _dq_picked (id UUID PRIMARY KEY) ON COMMIT DROP;
  EXCEPTION WHEN duplicate_table THEN
    TRUNCATE TABLE _dq_picked;
  END;

  -- ── Count distinct non-empty cells ─────────────────────────────────────────
  SELECT COUNT(DISTINCT (
    COALESCE(chapter,    ''),
    COALESCE(difficulty, ''),
    COALESCE(exam_type,  '')
  ))::INT INTO v_cell_count
  FROM questions
  WHERE (subject = p_subject
      OR (p_subject_name IS NOT NULL AND subject = p_subject_name))
    AND status = 'Approved'
    AND (p_chapters    IS NULL OR chapter    = ANY(p_chapters))
    AND (p_topics      IS NULL OR topic      = ANY(p_topics))
    AND (p_difficulties IS NULL OR difficulty = ANY(p_difficulties))
    AND (p_exam_types   IS NULL OR exam_type  = ANY(p_exam_types));

  IF v_cell_count = 0 THEN RETURN; END IF;

  v_quota     := p_total / v_cell_count;
  v_remainder := p_total % v_cell_count;

  -- ── Per-cell pass ──────────────────────────────────────────────────────────
  FOR v_cell IN
    SELECT
      chapter,
      difficulty,
      exam_type,
      COUNT(*)::INT AS available
    FROM questions
    WHERE (subject = p_subject
        OR (p_subject_name IS NOT NULL AND subject = p_subject_name))
      AND status = 'Approved'
      AND (p_chapters    IS NULL OR chapter    = ANY(p_chapters))
      AND (p_topics      IS NULL OR topic      = ANY(p_topics))
      AND (p_difficulties IS NULL OR difficulty = ANY(p_difficulties))
      AND (p_exam_types   IS NULL OR exam_type  = ANY(p_exam_types))
    GROUP BY chapter, difficulty, exam_type
    ORDER BY chapter NULLS LAST, difficulty NULLS LAST, exam_type NULLS LAST
  LOOP
    -- Cap quota to what this cell actually has
    v_needed   := LEAST(
                    v_quota + CASE WHEN v_cell_idx < v_remainder THEN 1 ELSE 0 END,
                    v_cell.available
                  );
    v_cell_idx := v_cell_idx + 1;
    v_added    := 0;

    IF v_needed = 0 THEN CONTINUE; END IF;

    v_oversample := GREATEST(v_needed * 4, 20);

    -- ── Priority 1: Unused questions (never attempted by this user) ──────────
    IF p_user_id IS NOT NULL AND v_added < v_needed THEN
      FOR v_q IN
        SELECT q.* FROM questions q
        WHERE q.id IN (
          SELECT cand.id FROM (
            SELECT q2.id
            FROM   questions q2
            LEFT JOIN user_question_analytics uqa
                   ON uqa.question_id = q2.id AND uqa.user_id = p_user_id
            LEFT JOIN _dq_picked dp ON dp.id = q2.id
            WHERE (q2.subject = p_subject
                OR (p_subject_name IS NOT NULL AND q2.subject = p_subject_name))
              AND q2.status        = 'Approved'
              AND uqa.question_id IS NULL   -- never seen
              AND dp.id           IS NULL   -- not already picked
              AND (v_cell.chapter    IS NULL OR q2.chapter    = v_cell.chapter)
              AND (v_cell.difficulty IS NULL OR q2.difficulty = v_cell.difficulty)
              AND (v_cell.exam_type  IS NULL OR q2.exam_type  = v_cell.exam_type)
              AND (p_topics IS NULL OR q2.topic = ANY(p_topics))
            LIMIT v_oversample
          ) cand
          ORDER BY random()
          LIMIT (v_needed - v_added)
        )
      LOOP
        INSERT INTO _dq_picked VALUES (v_q.id) ON CONFLICT DO NOTHING;
        v_added := v_added + 1;
        RETURN NEXT v_q;
      END LOOP;
    END IF;

    -- ── Priority 2: Mistaken questions (attempted but never answered correctly)
    IF p_user_id IS NOT NULL AND v_added < v_needed THEN
      FOR v_q IN
        SELECT q.*
        FROM   questions q
        JOIN   user_question_analytics uqa
               ON uqa.question_id = q.id AND uqa.user_id = p_user_id
        LEFT JOIN _dq_picked dp ON dp.id = q.id
        WHERE (q.subject = p_subject
            OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
          AND q.status        = 'Approved'
          AND uqa.is_mistaken = true
          AND dp.id           IS NULL
          AND (v_cell.chapter    IS NULL OR q.chapter    = v_cell.chapter)
          AND (v_cell.difficulty IS NULL OR q.difficulty = v_cell.difficulty)
          AND (v_cell.exam_type  IS NULL OR q.exam_type  = v_cell.exam_type)
          AND (p_topics IS NULL OR q.topic = ANY(p_topics))
        ORDER BY uqa.last_attempted_at ASC
        LIMIT (v_needed - v_added)
      LOOP
        INSERT INTO _dq_picked VALUES (v_q.id) ON CONFLICT DO NOTHING;
        v_added := v_added + 1;
        RETURN NEXT v_q;
      END LOOP;
    END IF;

    -- ── Priority 3: Random fill ──────────────────────────────────────────────
    IF v_added < v_needed THEN
      FOR v_q IN
        SELECT q.* FROM questions q
        WHERE q.id IN (
          SELECT cand.id FROM (
            SELECT q2.id
            FROM   questions q2
            LEFT JOIN _dq_picked dp ON dp.id = q2.id
            WHERE (q2.subject = p_subject
                OR (p_subject_name IS NOT NULL AND q2.subject = p_subject_name))
              AND q2.status = 'Approved'
              AND dp.id     IS NULL
              AND (v_cell.chapter    IS NULL OR q2.chapter    = v_cell.chapter)
              AND (v_cell.difficulty IS NULL OR q2.difficulty = v_cell.difficulty)
              AND (v_cell.exam_type  IS NULL OR q2.exam_type  = v_cell.exam_type)
              AND (p_topics IS NULL OR q2.topic = ANY(p_topics))
            LIMIT v_oversample
          ) cand
          ORDER BY random()
          LIMIT (v_needed - v_added)
        )
      LOOP
        INSERT INTO _dq_picked VALUES (v_q.id) ON CONFLICT DO NOTHING;
        v_added := v_added + 1;
        RETURN NEXT v_q;
      END LOOP;
    END IF;

    v_fetched_total := v_fetched_total + v_added;
  END LOOP;

  -- ── Top-up pass: fill any remaining shortfall without distribution constraint
  IF v_fetched_total < p_total THEN
    v_oversample := GREATEST((p_total - v_fetched_total) * 4, 20);
    FOR v_q IN
      SELECT q.* FROM questions q
      WHERE q.id IN (
        SELECT cand.id FROM (
          SELECT q2.id
          FROM   questions q2
          LEFT JOIN _dq_picked dp ON dp.id = q2.id
          WHERE (q2.subject = p_subject
              OR (p_subject_name IS NOT NULL AND q2.subject = p_subject_name))
            AND q2.status = 'Approved'
            AND dp.id     IS NULL
            AND (p_chapters    IS NULL OR q2.chapter    = ANY(p_chapters))
            AND (p_topics      IS NULL OR q2.topic      = ANY(p_topics))
            AND (p_difficulties IS NULL OR q2.difficulty = ANY(p_difficulties))
            AND (p_exam_types   IS NULL OR q2.exam_type  = ANY(p_exam_types))
          LIMIT v_oversample
        ) cand
        ORDER BY random()
        LIMIT (p_total - v_fetched_total)
      )
    LOOP
      INSERT INTO _dq_picked VALUES (v_q.id) ON CONFLICT DO NOTHING;
      v_fetched_total := v_fetched_total + 1;
      RETURN NEXT v_q;
    END LOOP;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Index: composite covering the most common per-cell filter ──────────────
-- (subject, status, difficulty) — eliminates multi-index intersection overhead.
CREATE INDEX IF NOT EXISTS idx_questions_subject_status_difficulty
  ON questions(subject, status, difficulty);
