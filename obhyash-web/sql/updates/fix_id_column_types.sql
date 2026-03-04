-- Migration: Fix chapter_id and topic_id column types 
-- Change from UUID to TEXT to support custom string IDs from hsc.ts (e.g., 'ban1_prose_1')

ALTER TABLE public.questions 
ALTER COLUMN chapter_id TYPE TEXT USING chapter_id::text,
ALTER COLUMN topic_id TYPE TEXT USING topic_id::text;

COMMENT ON COLUMN public.questions.chapter_id IS 'Chapter ID from hsc.ts (custom string)';
COMMENT ON COLUMN public.questions.topic_id IS 'Topic ID from hsc.ts (custom string)';
