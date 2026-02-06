-- ==============================================================
-- 1. UTILITY: INDEXING & SCHEMA UPDATES
-- ==============================================================

-- Ensure 'questions' table has necessary columns for filtering
-- Adding IF NOT EXISTS to avoid errors if they already exist
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "subject" text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "chapter" text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "topic" text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "difficulty" text DEFAULT 'Medium';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'MCQ';

-- Optional metadata columns for advanced filtering
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "stream" text; -- HSC, Admission
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "section" text; -- Group/Division
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "examType" text; -- Model Test ID or type
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS "points" numeric DEFAULT 1;

-- Optimized Indexes for Fast Random Searches
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions("subject");
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions("chapter");
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions("topic");
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions("difficulty");

-- ==============================================================
-- 2. RPC: GET RANDOM QUESTIONS (The Core Engine)
-- ==============================================================
-- This function allows flexible filtering by subject (required),
-- and optional multi-select filtering for chapters and topics.
-- It returns 'limit_param' amount of random questions.

CREATE OR REPLACE FUNCTION get_random_questions(
    subject_param text,
    limit_param int,
    chapter_params text[] DEFAULT NULL,
    topic_params text[] DEFAULT NULL,
    difficulty_param text DEFAULT NULL
)
RETURNS SETOF public.questions
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.questions
    WHERE 
        ("subject" = subject_param)
        AND
        (
            chapter_params IS NULL 
            OR chapter_params = '{}' 
            OR "chapter" = ANY(chapter_params)
        )
        AND
        (
            topic_params IS NULL 
            OR topic_params = '{}' 
            OR "topic" = ANY(topic_params)
        )
        AND
        (
            difficulty_param IS NULL 
            OR "difficulty" = difficulty_param
        )
    ORDER BY random()
    LIMIT limit_param;
END;
$$;

-- Usage Example:
-- SELECT * FROM get_random_questions('Physics', 10, ARRAY['Vector', 'Dynamics'], NULL, 'Medium');
