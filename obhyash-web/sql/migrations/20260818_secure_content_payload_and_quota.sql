-- ==============================================================================
-- Migration: 20260818_secure_content_payload_and_quota.sql
-- Description: Production-grade Backend Content Protection, Exam Quota Enforcement,
--              and Server-Authoritative Question Distribution.
-- ==============================================================================

-- 1. UPGRADED SECURE RPC: get_distributed_exam_questions with Database-Level Paywall & Quota
CREATE OR REPLACE FUNCTION public.get_distributed_exam_questions(
  p_user_id       UUID,                 -- User ID (auth.uid() or passed)
  p_subject       TEXT,                 -- Subject identifier
  p_subject_name  TEXT   DEFAULT NULL,  -- Display name
  p_total         INT    DEFAULT 10,
  p_chapters      TEXT[] DEFAULT NULL,  -- Chapters filter
  p_topics        TEXT[] DEFAULT NULL,  -- Topics filter
  p_difficulties  TEXT[] DEFAULT NULL,  -- Difficulties filter
  p_exam_types    TEXT[] DEFAULT NULL   -- Exam types filter
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
  v_is_pro        BOOLEAN := FALSE;
  v_today_exams   INT := 0;
  v_effective_uid UUID;
BEGIN
  -- Determine effective user ID
  v_effective_uid := COALESCE(p_user_id, auth.uid());

  -- Check Pro status via Single Source of Truth
  IF v_effective_uid IS NOT NULL THEN
    v_is_pro := public.is_user_subscribed(v_effective_uid);
  END IF;

  -- ── Server-Side Gatekeeper 1: Free User Question Limit (Max 50) ──
  IF NOT v_is_pro AND p_total > 50 THEN
    p_total := 50;
  END IF;

  -- ── Server-Side Gatekeeper 2: Free User Daily Exam Quota (Max 2 per day) ──
  IF NOT v_is_pro AND v_effective_uid IS NOT NULL THEN
    SELECT COUNT(*) INTO v_today_exams
    FROM public.exam_results
    WHERE user_id = v_effective_uid
      AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'UTC');

    IF v_today_exams >= 2 THEN
      RAISE EXCEPTION 'আজকের দৈনিক ফ্রি পরীক্ষার কোটা (২টি) সমাপ্ত হয়েছে। আনলিমিটেড পরীক্ষার জন্য প্রো সাবস্ক্রিপশন গ্রহণ করুন। (ERR_QUOTA_EXCEEDED)';
    END IF;
  END IF;

  -- ── Dedup table: O(log N) NOT EXISTS via PK index ──
  BEGIN
    CREATE TEMP TABLE _dq_picked (id UUID PRIMARY KEY) ON COMMIT DROP;
  EXCEPTION WHEN duplicate_table THEN
    TRUNCATE TABLE _dq_picked;
  END;

  -- ── Count distinct non-empty cells ──
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

  -- ── Per-cell pass ──
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
    v_needed := LEAST(
      v_quota + CASE WHEN v_cell_idx < v_remainder THEN 1 ELSE 0 END,
      v_cell.available
    );
    v_cell_idx := v_cell_idx + 1;
    IF v_needed <= 0 THEN CONTINUE; END IF;

    v_added := 0;

    -- Tier A: Unused by this user
    IF v_effective_uid IS NOT NULL AND v_added < v_needed THEN
      FOR v_q IN
        SELECT q.*
        FROM questions q
        WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
          AND q.status = 'Approved'
          AND COALESCE(q.chapter,    '') = COALESCE(v_cell.chapter,    '')
          AND COALESCE(q.difficulty, '') = COALESCE(v_cell.difficulty, '')
          AND COALESCE(q.exam_type,  '') = COALESCE(v_cell.exam_type,  '')
          AND NOT EXISTS (SELECT 1 FROM _dq_picked WHERE id = q.id)
          AND NOT EXISTS (SELECT 1 FROM user_question_stats WHERE user_id = v_effective_uid AND question_id = q.id)
        ORDER BY random()
        LIMIT (v_needed - v_added)
      LOOP
        INSERT INTO _dq_picked VALUES (v_q.id);
        RETURN NEXT v_q;
        v_added         := v_added + 1;
        v_fetched_total := v_fetched_total + 1;
      END LOOP;
    END IF;

    -- Tier B: Mistaken previously
    IF v_effective_uid IS NOT NULL AND v_added < v_needed THEN
      FOR v_q IN
        SELECT q.*
        FROM questions q
        JOIN user_question_stats uqs ON uqs.question_id = q.id AND uqs.user_id = v_effective_uid
        WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
          AND q.status = 'Approved'
          AND COALESCE(q.chapter,    '') = COALESCE(v_cell.chapter,    '')
          AND COALESCE(q.difficulty, '') = COALESCE(v_cell.difficulty, '')
          AND COALESCE(q.exam_type,  '') = COALESCE(v_cell.exam_type,  '')
          AND uqs.incorrect_count > 0
          AND NOT EXISTS (SELECT 1 FROM _dq_picked WHERE id = q.id)
        ORDER BY random()
        LIMIT (v_needed - v_added)
      LOOP
        INSERT INTO _dq_picked VALUES (v_q.id);
        RETURN NEXT v_q;
        v_added         := v_added + 1;
        v_fetched_total := v_fetched_total + 1;
      END LOOP;
    END IF;

    -- Tier C: Random from cell
    IF v_added < v_needed THEN
      FOR v_q IN
        SELECT q.*
        FROM questions q
        WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
          AND q.status = 'Approved'
          AND COALESCE(q.chapter,    '') = COALESCE(v_cell.chapter,    '')
          AND COALESCE(q.difficulty, '') = COALESCE(v_cell.difficulty, '')
          AND COALESCE(q.exam_type,  '') = COALESCE(v_cell.exam_type,  '')
          AND NOT EXISTS (SELECT 1 FROM _dq_picked WHERE id = q.id)
        ORDER BY random()
        LIMIT (v_needed - v_added)
      LOOP
        INSERT INTO _dq_picked VALUES (v_q.id);
        RETURN NEXT v_q;
        v_added         := v_added + 1;
        v_fetched_total := v_fetched_total + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- ── Top-up pass if shortfall ──
  IF v_fetched_total < p_total THEN
    FOR v_q IN
      SELECT q.*
      FROM questions q
      WHERE (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
        AND q.status = 'Approved'
        AND (p_chapters     IS NULL OR q.chapter    = ANY(p_chapters))
        AND (p_topics       IS NULL OR q.topic      = ANY(p_topics))
        AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
        AND (p_exam_types   IS NULL OR q.exam_type  = ANY(p_exam_types))
        AND NOT EXISTS (SELECT 1 FROM _dq_picked WHERE id = q.id)
      ORDER BY random()
      LIMIT (p_total - v_fetched_total)
    LOOP
      INSERT INTO _dq_picked VALUES (v_q.id);
      RETURN NEXT v_q;
      v_fetched_total := v_fetched_total + 1;
    END LOOP;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_distributed_exam_questions(UUID, TEXT, TEXT, INT, TEXT[], TEXT[], TEXT[], TEXT[]) TO anon, authenticated, service_role;


-- 2. SECURE RLS POLICIES ON EXAM RESULTS & MODEL TESTS
ALTER TABLE IF EXISTS public.exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own exam results" ON public.exam_results;
CREATE POLICY "Users can insert own exam results"
ON public.exam_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own exam results" ON public.exam_results;
CREATE POLICY "Users can view own exam results"
ON public.exam_results FOR SELECT
USING (auth.uid() = user_id);

-- Output status
DO $$
BEGIN
    RAISE NOTICE '✅ [20260818] Server-authoritative content paywall and quota RPC successfully configured!';
END $$;
