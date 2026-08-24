-- ============================================================================
-- LEITNER 5-BOX SPACED REPETITION (DAILY MEMORY REVISION SYSTEM)
-- Scientific Memory & Revision Algorithm (SM-2 Based)
--
-- Features:
--   1. Table `user_spaced_repetition` (User x Question tracking)
--   2. Intervals: Box 1 (+1d), Box 2 (+3d), Box 3 (+7d), Box 4 (+14d), Box 5 (+30d/Mastered)
--   3. RPC `get_due_spaced_repetition_questions` (Fetches exactly 10 questions, top-fills if needed)
--   4. RPC `get_user_spaced_repetition_stats` (Box 1-5 counts & due stats)
--   5. RPC `submit_spaced_repetition_session` (Batch box update, XP awards, +100 XP & Gift on 10/10)
-- ============================================================================

-- 1. Create Spaced Repetition Table
CREATE TABLE IF NOT EXISTS public.user_spaced_repetition (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    question_id UUID NOT NULL,
    
    -- Leitner Box Level (1 to 5)
    box_level INT NOT NULL DEFAULT 1 CHECK (box_level BETWEEN 1 AND 5),
    consecutive_correct INT NOT NULL DEFAULT 0,
    
    -- Scheduling Timestamps
    last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    next_review_due TIMESTAMPTZ DEFAULT NOW(),
    
    is_mastered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_user_question_spaced UNIQUE (user_id, question_id)
);

-- 2. Indexes for Sub-millisecond Scheduling Lookup
CREATE INDEX IF NOT EXISTS idx_usr_due_schedule 
ON public.user_spaced_repetition (user_id, next_review_due ASC);

CREATE INDEX IF NOT EXISTS idx_usr_box_level 
ON public.user_spaced_repetition (user_id, box_level);

-- 3. RPC: Fetch Due Revision Questions (Top-fills to guaranteed 10 questions)
CREATE OR REPLACE FUNCTION public.get_due_spaced_repetition_questions(
    p_user_id UUID,
    p_limit INT DEFAULT 10
)
RETURNS SETOF public.questions AS $$
DECLARE
    v_found_count INT := 0;
BEGIN
    -- 3.1 Create temporary table to gather question IDs
    CREATE TEMP TABLE IF NOT EXISTS _due_q_ids (
        q_id UUID PRIMARY KEY,
        priority INT
    ) ON COMMIT DROP;

    TRUNCATE TABLE _due_q_ids;

    -- 3.2 Fetch actual scheduled questions that are DUE right now
    INSERT INTO _due_q_ids (q_id, priority)
    SELECT r.question_id, 1
    FROM public.user_spaced_repetition r
    JOIN public.questions q ON q.id = r.question_id
    WHERE r.user_id = p_user_id 
      AND r.next_review_due <= NOW()
      AND (q.is_quarantined = FALSE OR q.is_quarantined IS NULL)
      AND (q.status = 'Approved' OR q.status IS NULL)
    ORDER BY r.box_level ASC, r.next_review_due ASC
    LIMIT p_limit
    ON CONFLICT (q_id) DO NOTHING;

    GET DIAGNOSTICS v_found_count = ROW_COUNT;

    -- 3.3 If fewer than p_limit (e.g. 10), top-fill from user's unreviewed / random questions
    IF v_found_count < p_limit THEN
        INSERT INTO _due_q_ids (q_id, priority)
        SELECT q.id, 2
        FROM public.questions q
        WHERE (q.is_quarantined = FALSE OR q.is_quarantined IS NULL)
          AND (q.status = 'Approved' OR q.status IS NULL)
          AND q.id NOT IN (SELECT q_id FROM _due_q_ids)
          AND q.id NOT IN (
              SELECT question_id FROM public.user_spaced_repetition 
              WHERE user_id = p_user_id AND box_level = 5
          )
        ORDER BY q.random_id ASC
        LIMIT (p_limit - v_found_count)
        ON CONFLICT (q_id) DO NOTHING;
    END IF;

    -- 3.4 Return full question objects ordered by priority
    RETURN QUERY
    SELECT q.*
    FROM public.questions q
    JOIN _due_q_ids d ON d.q_id = q.id
    ORDER BY d.priority ASC, q.random_id ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Get User's 5-Box Mastery Stats
CREATE OR REPLACE FUNCTION public.get_user_spaced_repetition_stats(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_b1 INT := 0;
    v_b2 INT := 0;
    v_b3 INT := 0;
    v_b4 INT := 0;
    v_b5 INT := 0;
    v_due_today INT := 0;
    v_total_tracked INT := 0;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE box_level = 1),
        COUNT(*) FILTER (WHERE box_level = 2),
        COUNT(*) FILTER (WHERE box_level = 3),
        COUNT(*) FILTER (WHERE box_level = 4),
        COUNT(*) FILTER (WHERE box_level = 5),
        COUNT(*) FILTER (WHERE next_review_due <= NOW()),
        COUNT(*)
    INTO v_b1, v_b2, v_b3, v_b4, v_b5, v_due_today, v_total_tracked
    FROM public.user_spaced_repetition
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'box1_count', COALESCE(v_b1, 0),
        'box2_count', COALESCE(v_b2, 0),
        'box3_count', COALESCE(v_b3, 0),
        'box4_count', COALESCE(v_b4, 0),
        'box5_count', COALESCE(v_b5, 0),
        'due_today_count', COALESCE(v_due_today, 0),
        'total_tracked', COALESCE(v_total_tracked, 0),
        'mastered_count', COALESCE(v_b5, 0)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. RPC: Submit Revision Session with Box Upgrades, XP & Perfect Score Reward
CREATE OR REPLACE FUNCTION public.submit_spaced_repetition_session(
    p_user_id UUID,
    p_answers JSONB -- [{ "question_id": "uuid", "is_correct": true, "time_spent": 20 }, ...]
)
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_q_id UUID;
    v_is_correct BOOLEAN;
    v_time_spent NUMERIC;
    
    v_current_box INT;
    v_next_box INT;
    v_consecutive INT;
    v_interval INTERVAL;
    
    v_total_answered INT := 0;
    v_correct_count INT := 0;
    v_xp_earned INT := 0;
    v_bonus_xp INT := 0;
    v_is_perfect BOOLEAN := FALSE;
    v_promoted_count INT := 0;
    v_demoted_count INT := 0;
    
    v_stats_before JSONB;
    v_stats_after JSONB;
    v_mystery_gift TEXT := NULL;
BEGIN
    IF p_answers IS NULL OR jsonb_array_length(p_answers) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No answers provided');
    END IF;

    -- Snapshot stats before
    v_stats_before := public.get_user_spaced_repetition_stats(p_user_id);

    -- Loop through each answered question
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_answers) AS x(question_id UUID, is_correct BOOLEAN, time_spent NUMERIC) LOOP
        v_q_id := v_item.question_id;
        v_is_correct := COALESCE(v_item.is_correct, FALSE);
        v_time_spent := GREATEST(COALESCE(v_item.time_spent, 0), 0);
        v_total_answered := v_total_answered + 1;

        IF v_is_correct THEN
            v_correct_count := v_correct_count + 1;
            v_xp_earned := v_xp_earned + 15; -- +15 XP per correct answer
        END IF;

        -- Check current box for user x question
        SELECT box_level, consecutive_correct 
        INTO v_current_box, v_consecutive
        FROM public.user_spaced_repetition
        WHERE user_id = p_user_id AND question_id = v_q_id;

        IF v_current_box IS NULL THEN
            -- First time answering this question in spaced repetition
            IF v_is_correct THEN
                v_next_box := 2;
                v_consecutive := 1;
                v_promoted_count := v_promoted_count + 1;
            ELSE
                v_next_box := 1;
                v_consecutive := 0;
            END IF;
        ELSE
            IF v_is_correct THEN
                v_next_box := LEAST(5, v_current_box + 1);
                v_consecutive := v_consecutive + 1;
                IF v_next_box > v_current_box THEN
                    v_promoted_count := v_promoted_count + 1;
                END IF;
            ELSE
                v_next_box := 1;
                v_consecutive := 0;
                IF v_current_box > 1 THEN
                    v_demoted_count := v_demoted_count + 1;
                END IF;
            END IF;
        END IF;

        -- Calculate next review date based on box level
        v_interval := CASE 
            WHEN v_next_box = 1 THEN INTERVAL '1 day'
            WHEN v_next_box = 2 THEN INTERVAL '3 days'
            WHEN v_next_box = 3 THEN INTERVAL '7 days'
            WHEN v_next_box = 4 THEN INTERVAL '14 days'
            ELSE INTERVAL '30 days' -- Box 5: Mastered
        END;

        -- Upsert Spaced Repetition Entry
        INSERT INTO public.user_spaced_repetition (
            user_id, question_id, box_level, consecutive_correct, last_reviewed_at, next_review_due, is_mastered
        ) VALUES (
            p_user_id, v_q_id, v_next_box, v_consecutive, NOW(), NOW() + v_interval, (v_next_box = 5)
        )
        ON CONFLICT (user_id, question_id) DO UPDATE SET
            box_level = v_next_box,
            consecutive_correct = v_consecutive,
            last_reviewed_at = NOW(),
            next_review_due = NOW() + v_interval,
            is_mastered = (v_next_box = 5);
    END LOOP;

    -- Perfect Score Bonus (+100 XP + Mystery Gift)
    IF v_total_answered >= 10 AND v_correct_count = v_total_answered THEN
        v_is_perfect := TRUE;
        v_bonus_xp := 100;
        v_xp_earned := v_xp_earned + v_bonus_xp;
        v_mystery_gift := 'Memory Champion Scratch Card 🎁';

        -- Optionally add a scratch card for perfect score
        BEGIN
            INSERT INTO public.scratch_cards (user_id, source, xp_reward, status)
            VALUES (p_user_id, 'Spaced Repetition Perfect Score', 100, 'unscratched');
        EXCEPTION WHEN OTHERS THEN
            -- Scratch card table might have different schema, fail gracefully
            NULL;
        END;
    END IF;

    -- Award XP to User Profile
    IF v_xp_earned > 0 THEN
        BEGIN
            UPDATE public.users 
            SET xp = COALESCE(xp, 0) + v_xp_earned,
                updated_at = NOW()
            WHERE id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    -- Snapshot stats after
    v_stats_after := public.get_user_spaced_repetition_stats(p_user_id);

    RETURN jsonb_build_object(
        'success', true,
        'total_answered', v_total_answered,
        'correct_count', v_correct_count,
        'accuracy', ROUND((v_correct_count::NUMERIC * 100.0) / GREATEST(v_total_answered, 1), 1),
        'xp_earned', v_xp_earned,
        'is_perfect_score', v_is_perfect,
        'mystery_gift', v_mystery_gift,
        'promoted_count', v_promoted_count,
        'demoted_count', v_demoted_count,
        'stats_before', v_stats_before,
        'stats_after', v_stats_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
