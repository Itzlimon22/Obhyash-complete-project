-- ==============================================================
-- SQL Migration: Full Production Live Exams System (Chorcha-Level)
-- Run this in Supabase SQL Editor
-- ==============================================================

-- 1. Create live_exams table
CREATE TABLE IF NOT EXISTS public.live_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT 'all', -- hsc, medical, engineering, varsity_a, ssc, all
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    total_marks INT NOT NULL DEFAULT 25,
    negative_marking NUMERIC NOT NULL DEFAULT 0.25,
    status TEXT NOT NULL DEFAULT 'published', -- draft, published, archived
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 2. Create live_exam_questions table (Junction)
CREATE TABLE IF NOT EXISTS public.live_exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_exam_id UUID NOT NULL REFERENCES public.live_exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    serial INT NOT NULL DEFAULT 1,
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
    score NUMERIC DEFAULT 0,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    user_answers JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'ongoing', -- ongoing, submitted
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (live_exam_id, user_id)
);

-- ==============================================================
-- Performance Indexes
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_live_exams_category ON public.live_exams(category);
CREATE INDEX IF NOT EXISTS idx_live_exams_status ON public.live_exams(status);
CREATE INDEX IF NOT EXISTS idx_live_exams_start_time ON public.live_exams(start_time);
CREATE INDEX IF NOT EXISTS idx_live_exams_end_time ON public.live_exams(end_time);

CREATE INDEX IF NOT EXISTS idx_live_exam_questions_live_exam_id ON public.live_exam_questions(live_exam_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_questions_question_id ON public.live_exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_questions_serial ON public.live_exam_questions(serial);

CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_live_exam_id ON public.live_exam_attempts(live_exam_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_user_id ON public.live_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_score ON public.live_exam_attempts(score DESC);
CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_status ON public.live_exam_attempts(status);

-- ==============================================================
-- Realtime Broadcasting
-- ==============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'live_exams'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_exams;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'live_exam_attempts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_exam_attempts;
    END IF;
END $$;

-- ==============================================================
-- Row Level Security (RLS) Policies
-- ==============================================================
ALTER TABLE public.live_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_exam_attempts ENABLE ROW LEVEL SECURITY;

-- 1. live_exams Policies
DROP POLICY IF EXISTS "Public can view published exams" ON public.live_exams;
CREATE POLICY "Public can view published exams" 
    ON public.live_exams FOR SELECT 
    USING (status = 'published');

DROP POLICY IF EXISTS "Admins and Teachers have full access to live_exams" ON public.live_exams;
CREATE POLICY "Admins and Teachers have full access to live_exams" 
    ON public.live_exams FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND lower(users.role) IN ('admin', 'teacher', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND lower(users.role) IN ('admin', 'teacher', 'superadmin')
        )
    );

-- 2. live_exam_questions Policies
DROP POLICY IF EXISTS "Public can view questions for published exams" ON public.live_exam_questions;
CREATE POLICY "Public can view questions for published exams" 
    ON public.live_exam_questions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.live_exams 
            WHERE live_exams.id = live_exam_questions.live_exam_id 
            AND live_exams.status = 'published'
        )
    );

DROP POLICY IF EXISTS "Admins have full access to live_exam_questions" ON public.live_exam_questions;
CREATE POLICY "Admins have full access to live_exam_questions" 
    ON public.live_exam_questions FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND lower(users.role) IN ('admin', 'teacher', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND lower(users.role) IN ('admin', 'teacher', 'superadmin')
        )
    );

-- 3. live_exam_attempts Policies
DROP POLICY IF EXISTS "Users can view own attempts" ON public.live_exam_attempts;
CREATE POLICY "Users can view own attempts" 
    ON public.live_exam_attempts FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own attempts" ON public.live_exam_attempts;
CREATE POLICY "Users can insert own attempts" 
    ON public.live_exam_attempts FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own attempts" ON public.live_exam_attempts;
CREATE POLICY "Users can update own attempts" 
    ON public.live_exam_attempts FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view leaderboard (all attempts)" ON public.live_exam_attempts;
CREATE POLICY "Public can view leaderboard (all attempts)"
    ON public.live_exam_attempts FOR SELECT
    USING (status = 'submitted');

DROP POLICY IF EXISTS "Admins have full access to live_exam_attempts" ON public.live_exam_attempts;
CREATE POLICY "Admins have full access to live_exam_attempts" 
    ON public.live_exam_attempts FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND lower(users.role) IN ('admin', 'teacher', 'superadmin')
        )
    );
