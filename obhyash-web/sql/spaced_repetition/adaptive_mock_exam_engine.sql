-- ============================================================================
-- ADAPTIVE MOCK EXAM ENGINE (75% New + 25% Spaced Weakness Mix)
-- 
-- Features:
--   1. RPC `get_adaptive_mock_exam_questions`:
--      - 25% questions from user's past mistakes & unmastered spaced repetition queue
--      - 75% brand new questions from question bank
--      - 100% blended & randomized with unbiased shuffle
--   2. RPC `record_exam_spaced_repetition`:
--      - Automatically records mock/live exam results into user_spaced_repetition
--      - 3 consecutive correct answers = Mastered 🏆
-- ============================================================================

-- 1. Batch Record Exam Outcomes into Spaced Repetition Queue
CREATE OR REPLACE FUNCTION public.record_exam_spaced_repetition(
    p_user_id UUID,
    p_question_ids UUID[],
    p_are_correct BOOLEAN[]
)
RETURNS VOID AS $$
DECLARE
    v_len INT;
    v_i INT;
    v_q_id UUID;
    v_correct BOOLEAN;
    v_curr_box INT;
    v_consecutive INT;
    v_next_box INT;
    v_interval INTERVAL;
    v_mastered BOOLEAN;
BEGIN
    IF p_user_id IS NULL OR p_question_ids IS NULL THEN
        RETURN;
    END IF;

    v_len := array_length(p_question_ids, 1);
    IF v_len IS NULL OR v_len = 0 THEN
        RETURN;
    END IF;

    FOR v_i IN 1..v_len LOOP
        v_q_id := p_question_ids[v_i];
        v_correct := COALESCE(p_are_correct[v_i], FALSE);

        SELECT box_level, consecutive_correct 
        INTO v_curr_box, v_consecutive
        FROM public.user_spaced_repetition
        WHERE user_id = p_user_id AND question_id = v_q_id;

        IF v_curr_box IS NULL THEN
            IF v_correct THEN
                v_next_box := 2;
                v_consecutive := 1;
                v_mastered := FALSE;
            ELSE
                v_next_box := 1;
                v_consecutive := 0;
                v_mastered := FALSE;
            END IF;
        ELSE
            IF v_correct THEN
                v_consecutive := v_consecutive + 1;
                v_next_box := LEAST(5, v_curr_box + 1);
                -- 3 consecutive correct answers = Mastered 🏆
                v_mastered := (v_consecutive >= 3 OR v_next_box = 5);
            ELSE
                v_next_box := 1;
                v_consecutive := 0;
                v_mastered := FALSE;
            END IF;
        END IF;

        v_interval := CASE 
            WHEN v_next_box = 1 THEN INTERVAL '1 day'
            WHEN v_next_box = 2 THEN INTERVAL '3 days'
            WHEN v_next_box = 3 THEN INTERVAL '7 days'
            WHEN v_next_box = 4 THEN INTERVAL '14 days'
            ELSE INTERVAL '30 days'
        END;

        INSERT INTO public.user_spaced_repetition (
            user_id, question_id, box_level, consecutive_correct, last_reviewed_at, next_review_due, is_mastered
        ) VALUES (
            p_user_id, v_q_id, v_next_box, v_consecutive, NOW(), NOW() + v_interval, v_mastered
        )
        ON CONFLICT (user_id, question_id) DO UPDATE SET
            box_level = v_next_box,
            consecutive_correct = v_consecutive,
            last_reviewed_at = NOW(),
            next_review_due = NOW() + v_interval,
            is_mastered = v_mastered;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Smart Adaptive Mock Exam Question Generator (75% New + 25% Weakness Mix)
CREATE OR REPLACE FUNCTION public.get_adaptive_mock_exam_questions(
    p_user_id       UUID,                 -- NULL for anonymous / unauthenticated
    p_subject       TEXT,                 -- subject UUID / internal ID
    p_subject_name  TEXT   DEFAULT NULL,  -- display-name form (NFC/NFD)
    p_total         INT    DEFAULT 25,
    p_chapters      TEXT[] DEFAULT NULL,  -- NULL = all chapters
    p_topics        TEXT[] DEFAULT NULL,  -- NULL = all topics
    p_difficulties  TEXT[] DEFAULT NULL,  -- NULL = all difficulties
    p_exam_types    TEXT[] DEFAULT NULL   -- NULL = all exam types
) RETURNS SETOF public.questions AS $$
DECLARE
    v_weakness_quota INT := 0;
    v_weakness_found INT := 0;
    v_new_needed INT := p_total;
BEGIN
    -- Temporary table for picked questions
    CREATE TEMP TABLE IF NOT EXISTS _adaptive_mock_picked (
        q_id UUID PRIMARY KEY,
        is_revision BOOLEAN
    ) ON COMMIT DROP;

    TRUNCATE TABLE _adaptive_mock_picked;

    -- Calculate 25% weakness quota if user is authenticated
    IF p_user_id IS NOT NULL AND p_total >= 4 THEN
        v_weakness_quota := ROUND(p_total * 0.25)::INT;
    END IF;

    -- 2.1 Fetch 25% Questions from User's Weakness / Unmastered Spaced Repetition Queue
    IF v_weakness_quota > 0 THEN
        INSERT INTO _adaptive_mock_picked (q_id, is_revision)
        SELECT q.id, TRUE
        FROM public.user_spaced_repetition r
        JOIN public.questions q ON q.id = r.question_id
        WHERE r.user_id = p_user_id
          AND r.is_mastered = FALSE
          AND (q.is_quarantined = FALSE OR q.is_quarantined IS NULL)
          AND (q.status = 'Approved' OR q.status IS NULL)
          AND (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
          AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
          AND (p_topics IS NULL OR q.topic = ANY(p_topics))
          AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
          AND (
            p_exam_types IS NULL
            OR 'Mixed' = ANY(p_exam_types)
            OR 'All' = ANY(p_exam_types)
            OR EXISTS (
              SELECT 1 FROM unnest(p_exam_types) AS pet 
              WHERE q.exam_type ILIKE '%' || pet || '%'
            )
          )
        ORDER BY r.box_level ASC, r.next_review_due ASC
        LIMIT v_weakness_quota
        ON CONFLICT (q_id) DO NOTHING;

        GET DIAGNOSTICS v_weakness_found = ROW_COUNT;
    END IF;

    -- 2.2 Top-fill 75% (or remainder) with Brand New / Unseen Questions
    v_new_needed := p_total - v_weakness_found;

    IF v_new_needed > 0 THEN
        INSERT INTO _adaptive_mock_picked (q_id, is_revision)
        SELECT q.id, FALSE
        FROM public.questions q
        WHERE (q.is_quarantined = FALSE OR q.is_quarantined IS NULL)
          AND (q.status = 'Approved' OR q.status IS NULL)
          AND (q.subject = p_subject OR (p_subject_name IS NOT NULL AND q.subject = p_subject_name))
          AND (p_chapters IS NULL OR q.chapter = ANY(p_chapters))
          AND (p_topics IS NULL OR q.topic = ANY(p_topics))
          AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
          AND (
            p_exam_types IS NULL
            OR 'Mixed' = ANY(p_exam_types)
            OR 'All' = ANY(p_exam_types)
            OR EXISTS (
              SELECT 1 FROM unnest(p_exam_types) AS pet 
              WHERE q.exam_type ILIKE '%' || pet || '%'
            )
          )
          AND q.id NOT IN (SELECT q_id FROM _adaptive_mock_picked)
          -- Exclude questions user has already Mastered 🏆
          AND (p_user_id IS NULL OR q.id NOT IN (
              SELECT question_id FROM public.user_spaced_repetition 
              WHERE user_id = p_user_id AND is_mastered = TRUE
          ))
        ORDER BY q.random_id ASC
        LIMIT v_new_needed
        ON CONFLICT (q_id) DO NOTHING;
    END IF;

    -- 2.3 Return all picked questions in completely random blended order
    RETURN QUERY
    SELECT q.*
    FROM public.questions q
    JOIN _adaptive_mock_picked p ON p.q_id = q.id
    ORDER BY random();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
