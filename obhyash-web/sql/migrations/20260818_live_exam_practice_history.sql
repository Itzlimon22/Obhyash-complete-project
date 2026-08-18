-- ==============================================================
-- Live Exam Practice History & Leaderboard Isolation Migration
-- ==============================================================

-- 1. Create live_exam_practice_history table
CREATE TABLE IF NOT EXISTS public.live_exam_practice_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_exam_id UUID NOT NULL REFERENCES public.live_exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score NUMERIC DEFAULT 0,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    unanswered_count INT DEFAULT 0,
    user_answers JSONB DEFAULT '{}'::jsonb,
    time_taken_seconds INT DEFAULT 0,
    submit_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast history query
CREATE INDEX IF NOT EXISTS idx_live_exam_practice_history_exam_user 
    ON public.live_exam_practice_history(live_exam_id, user_id, submit_time DESC);

CREATE INDEX IF NOT EXISTS idx_live_exam_practice_history_user_id 
    ON public.live_exam_practice_history(user_id);

-- 3. Row Level Security
ALTER TABLE public.live_exam_practice_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own practice history" ON public.live_exam_practice_history;
CREATE POLICY "Users can view own practice history"
    ON public.live_exam_practice_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own practice history" ON public.live_exam_practice_history;
CREATE POLICY "Users can insert own practice history"
    ON public.live_exam_practice_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to practice history" ON public.live_exam_practice_history;
CREATE POLICY "Admins have full access to practice history"
    ON public.live_exam_practice_history FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );
