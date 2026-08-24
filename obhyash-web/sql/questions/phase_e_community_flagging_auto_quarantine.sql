-- ============================================================================
-- PHASE E: Community Flagging & Auto-Quarantine System
-- Features:
--   1. Real-time Community Flagging & Report Tracking
--   2. Database-level Auto-Quarantine Trigger (Threshold: 3+ Reports)
--      - Automatically hides broken/reported questions from live exams in <1ms
--   3. Admin 1-Click Resolution Pipeline (Fix, Dismiss False Alarms, or Delete)
--   4. "Bug Hunter" XP Reward Engine for Helpful Student Reporters
-- ============================================================================

-- 1. Add Auto-Quarantine Columns to `questions` Table (Propagated to all partitions)
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS report_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_quarantined BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quarantine_reason TEXT DEFAULT NULL;

-- 2. Indexes for Sub-millisecond Partition Filtering
CREATE INDEX IF NOT EXISTS idx_qp_quarantined 
ON public.questions (is_quarantined);

CREATE INDEX IF NOT EXISTS idx_qp_report_count 
ON public.questions (report_count DESC);

-- 3. Automatic Database Trigger: When a Report is Created, Update Question & Auto-Quarantine
CREATE OR REPLACE FUNCTION public.trg_auto_quarantine_question()
RETURNS TRIGGER AS $$
DECLARE
    v_new_report_count INT;
BEGIN
    -- Update questions report_count and auto-quarantine if >= 3
    UPDATE public.questions
    SET 
        report_count = COALESCE(report_count, 0) + 1,
        is_quarantined = CASE 
            WHEN (COALESCE(report_count, 0) + 1) >= 3 THEN TRUE 
            ELSE is_quarantined 
        END,
        status = CASE 
            WHEN (COALESCE(report_count, 0) + 1) >= 3 THEN 'Quarantined' 
            ELSE status 
        END,
        quarantine_reason = CASE 
            WHEN (COALESCE(report_count, 0) + 1) >= 3 THEN 'Auto-quarantined: 3+ student reports received.' 
            ELSE quarantine_reason 
        END,
        updated_at = NOW()
    WHERE id::TEXT = NEW.question_id::TEXT;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reports_auto_quarantine ON public.reports;
CREATE TRIGGER trg_reports_auto_quarantine
    AFTER INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_auto_quarantine_question();

-- 4. High-Performance Submit Question Report RPC (Anti-Spam Protected)
CREATE OR REPLACE FUNCTION public.submit_question_report(
    p_question_id UUID,
    p_reporter_id UUID,
    p_reporter_name TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT 'Wrong Answer',
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_report_id UUID;
    v_report_count INT;
    v_is_quarantined BOOLEAN;
BEGIN
    -- 4.1 Anti-Spam: Check if user already submitted a pending report for this question
    IF p_reporter_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.reports 
        WHERE question_id = p_question_id::TEXT 
          AND reporter_id = p_reporter_id 
          AND status = 'Pending'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'You already have a pending report for this question.'
        );
    END IF;

    -- 4.2 Insert Report (Trigger will auto-increment report_count and quarantine if needed)
    INSERT INTO public.reports (
        question_id,
        reporter_id,
        reporter_name,
        reason,
        description,
        image_url,
        status,
        severity,
        created_at
    ) VALUES (
        p_question_id::TEXT,
        p_reporter_id,
        p_reporter_name,
        p_reason,
        p_description,
        p_image_url,
        'Pending',
        'Medium',
        NOW()
    ) RETURNING id INTO v_report_id;

    -- 4.3 Fetch updated status
    SELECT report_count, is_quarantined 
    INTO v_report_count, v_is_quarantined 
    FROM public.questions 
    WHERE id = p_question_id;

    RETURN jsonb_build_object(
        'success', true,
        'report_id', v_report_id,
        'report_count', v_report_count,
        'is_quarantined', v_is_quarantined,
        'message', 'Report submitted successfully. Thank you for making Obhyash accurate!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Admin 1-Click Question Resolution RPC
CREATE OR REPLACE FUNCTION public.admin_resolve_question(
    p_question_id UUID,
    p_action TEXT, -- 'APPROVE_FIXED' | 'DISMISS_FALSE_ALARM' | 'DELETE_QUESTION'
    p_updated_question TEXT DEFAULT NULL,
    p_updated_options TEXT[] DEFAULT NULL,
    p_updated_answer_indices INT[] DEFAULT NULL,
    p_updated_explanation TEXT DEFAULT NULL,
    p_admin_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_reporter_ids UUID[];
    v_reporter_id UUID;
BEGIN
    -- 5.1 Action: Fix Question & Re-activate to Live Exam Engine
    IF p_action = 'APPROVE_FIXED' THEN
        -- Collect reporters to award Bug Hunter XP
        SELECT ARRAY_AGG(DISTINCT reporter_id) INTO v_reporter_ids
        FROM public.reports
        WHERE question_id = p_question_id::TEXT AND reporter_id IS NOT NULL AND status = 'Pending';

        -- Update Question and clear quarantine
        UPDATE public.questions
        SET 
            question = COALESCE(p_updated_question, question),
            options = COALESCE(p_updated_options, options),
            correct_answer_indices = COALESCE(p_updated_answer_indices, correct_answer_indices),
            explanation = COALESCE(p_updated_explanation, explanation),
            status = 'Approved',
            is_quarantined = FALSE,
            report_count = 0,
            quarantine_reason = NULL,
            updated_at = NOW()
        WHERE id = p_question_id;

        -- Mark all reports as Resolved
        UPDATE public.reports
        SET 
            status = 'Resolved',
            resolved_at = NOW(),
            admin_comment = COALESCE(p_admin_comment, 'Question has been corrected and re-activated.')
        WHERE question_id = p_question_id::TEXT AND status = 'Pending';

        -- Reward helpful reporters with +25 Bug Hunter XP
        IF v_reporter_ids IS NOT NULL THEN
            FOREACH v_reporter_id IN ARRAY v_reporter_ids LOOP
                PERFORM public.increment_user_xp(v_reporter_id, 25);
            END LOOP;
        END IF;

        RETURN jsonb_build_object('success', true, 'message', 'Question fixed, re-activated, and reporters rewarded.');

    -- 5.2 Action: Dismiss False Alarm (Students were mistaken, question is valid)
    ELSIF p_action = 'DISMISS_FALSE_ALARM' THEN
        UPDATE public.questions
        SET 
            status = 'Approved',
            is_quarantined = FALSE,
            report_count = 0,
            quarantine_reason = NULL,
            updated_at = NOW()
        WHERE id = p_question_id;

        UPDATE public.reports
        SET 
            status = 'Ignored',
            resolved_at = NOW(),
            admin_comment = COALESCE(p_admin_comment, 'Verified accurate by review team.')
        WHERE question_id = p_question_id::TEXT AND status = 'Pending';

        RETURN jsonb_build_object('success', true, 'message', 'Reports dismissed as false alarm. Question re-activated.');

    -- 5.3 Action: Delete or Reject Question
    ELSIF p_action = 'DELETE_QUESTION' THEN
        UPDATE public.questions
        SET 
            status = 'Rejected',
            is_quarantined = TRUE,
            quarantine_reason = 'Rejected and deactivated by Admin.',
            updated_at = NOW()
        WHERE id = p_question_id;

        UPDATE public.reports
        SET 
            status = 'Resolved',
            resolved_at = NOW(),
            admin_comment = COALESCE(p_admin_comment, 'Question rejected and removed from pool.')
        WHERE question_id = p_question_id::TEXT AND status = 'Pending';

        RETURN jsonb_build_object('success', true, 'message', 'Question rejected and removed from exam pool.');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Invalid resolution action.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin Review Queue RPC: Get all Quarantined & High-Report Questions
CREATE OR REPLACE FUNCTION public.get_quarantined_review_queue(
    p_stream TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    question TEXT,
    options TEXT[],
    correct_answer_indices INT[],
    explanation TEXT,
    subject TEXT,
    chapter TEXT,
    stream TEXT,
    report_count INT,
    is_quarantined BOOLEAN,
    quarantine_reason TEXT,
    pending_reports_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question,
        q.options,
        q.correct_answer_indices,
        q.explanation,
        q.subject,
        q.chapter,
        q.stream,
        q.report_count,
        q.is_quarantined,
        q.quarantine_reason,
        COUNT(r.id) AS pending_reports_count
    FROM public.questions q
    LEFT JOIN public.reports r ON r.question_id = q.id::TEXT AND r.status = 'Pending'
    WHERE 
        (q.is_quarantined = TRUE OR q.report_count > 0 OR q.status = 'Quarantined')
        AND (p_stream IS NULL OR q.stream_id = p_stream OR q.stream = p_stream)
    GROUP BY q.id
    ORDER BY q.is_quarantined DESC, q.report_count DESC, q.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
