-- ==============================================================
-- SQL Migration: Live Exams Setup
-- ==============================================================

-- 1. Create live_exams table
CREATE TABLE IF NOT EXISTS public.live_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL,
    total_marks INT NOT NULL,
    negative_marking NUMERIC NOT NULL DEFAULT 0.25,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 2. Create live_exam_questions table (Junction)
CREATE TABLE IF NOT EXISTS public.live_exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_exam_id UUID NOT NULL REFERENCES public.live_exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    serial INT NOT NULL,
    points NUMERIC NOT NULL DEFAULT 1,
    UNIQUE (live_exam_id, question_id)
);

-- 3. Create live_exam_attempts table
CREATE TABLE IF NOT EXISTS public.live_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_exam_id UUID NOT NULL REFERENCES public.live_exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    submit_time TIMESTAMPTZ,
    score NUMERIC,
    correct_count INT,
    wrong_count INT,
    user_answers JSONB,
    status TEXT NOT NULL DEFAULT 'ongoing', -- ongoing, submitted
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (live_exam_id, user_id)
);

-- ==============================================================
-- Indexes
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_live_exams_category ON public.live_exams(category);
CREATE INDEX IF NOT EXISTS idx_live_exams_status ON public.live_exams(status);
CREATE INDEX IF NOT EXISTS idx_live_exams_start_time ON public.live_exams(start_time);

CREATE INDEX IF NOT EXISTS idx_live_exam_questions_live_exam_id ON public.live_exam_questions(live_exam_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_questions_question_id ON public.live_exam_questions(question_id);

CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_live_exam_id ON public.live_exam_attempts(live_exam_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_user_id ON public.live_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_score ON public.live_exam_attempts(score DESC);

-- ==============================================================
-- Row Level Security (RLS) Policies
-- ==============================================================

-- Enable RLS
ALTER TABLE public.live_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_exam_attempts ENABLE ROW LEVEL SECURITY;

-- live_exams RLS
-- Anyone can read published exams. Admins can read all.
CREATE POLICY "Public can view published exams" 
    ON public.live_exams FOR SELECT 
    USING (status = 'published');

CREATE POLICY "Admins have full access to live_exams" 
    ON public.live_exams FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'Admin'
        )
    );

-- live_exam_questions RLS
-- Public can read questions if the exam is published (ideally only when exam has started, but frontend will control)
CREATE POLICY "Public can view questions for published exams" 
    ON public.live_exam_questions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.live_exams 
            WHERE live_exams.id = live_exam_questions.live_exam_id 
            AND live_exams.status = 'published'
        )
    );

CREATE POLICY "Admins have full access to live_exam_questions" 
    ON public.live_exam_questions FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'Admin'
        )
    );

-- live_exam_attempts RLS
-- Users can read their own attempts, insert their own, update their own (for submission)
CREATE POLICY "Users can view own attempts" 
    ON public.live_exam_attempts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" 
    ON public.live_exam_attempts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts" 
    ON public.live_exam_attempts FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view leaderboard (all attempts)"
    ON public.live_exam_attempts FOR SELECT
    USING (status = 'submitted');

CREATE POLICY "Admins have full access to live_exam_attempts" 
    ON public.live_exam_attempts FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'Admin'
        )
    );
