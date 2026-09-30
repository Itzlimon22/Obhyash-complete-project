-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Live Exam Code & Isolated Secret Questions
-- Obhyash Smart Prep Platform
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Add exam_id and is_answer_published to live_exams
ALTER TABLE public.live_exams 
ADD COLUMN IF NOT EXISTS exam_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_answer_published BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_live_exams_exam_id ON public.live_exams(exam_id);

-- 2. Make live_exam_questions self-contained for secret questions
ALTER TABLE public.live_exam_questions 
ALTER COLUMN question_id DROP NOT NULL;

ALTER TABLE public.live_exam_questions
ADD COLUMN IF NOT EXISTS question TEXT,
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS correct_answer_index INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT 'medical',
ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_live_exam_questions_batch ON public.live_exam_questions(batch);

-- 3. Add time_taken_seconds and time_taken_ms to live_exam_attempts for millisecond-precision tie-breaking
ALTER TABLE public.live_exam_attempts
ADD COLUMN IF NOT EXISTS time_taken_seconds INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_taken_ms BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_live_exam_attempts_rank ON public.live_exam_attempts(live_exam_id, status, score DESC, time_taken_ms ASC, wrong_count ASC);


