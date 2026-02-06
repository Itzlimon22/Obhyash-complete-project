-- =====================================================
-- Professional Question Management System
-- Database Migration Script
-- =====================================================
-- This script migrates the questions table to support:
-- - Multiple correct answers (correct_answer_indices[])
-- - Variable number of options
-- - New fields: division, institutes[], years[], option_images[]
-- - Default exam_type = 'Academic'
-- =====================================================

-- Step 1: Backup existing data (optional but recommended)
-- Run this command before migration:
-- pg_dump -U your_user -d your_database -t questions > questions_backup.sql

-- Step 2: Add new columns (including exam_type if missing)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS exam_type VARCHAR(100) DEFAULT 'Academic',
ADD COLUMN IF NOT EXISTS division VARCHAR(50),
ADD COLUMN IF NOT EXISTS correct_answer_indices INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS option_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS institutes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS years INTEGER[] DEFAULT '{}';

-- Step 4: Migrate existing correct_answer to correct_answer_indices
-- This converts the single correct answer to an array with one element
DO $$
DECLARE
    question_record RECORD;
    answer_index INTEGER;
BEGIN
    FOR question_record IN 
        SELECT id, correct_answer, correct_answer_index, options 
        FROM questions 
        WHERE correct_answer_indices IS NULL OR array_length(correct_answer_indices, 1) IS NULL
    LOOP
        -- If correct_answer_index exists, use it
        IF question_record.correct_answer_index IS NOT NULL THEN
            answer_index := question_record.correct_answer_index;
        -- Otherwise, find the index by matching correct_answer with options
        ELSIF question_record.correct_answer IS NOT NULL AND question_record.options IS NOT NULL THEN
            -- Find the position of correct_answer in options array
            SELECT idx - 1 INTO answer_index
            FROM unnest(question_record.options) WITH ORDINALITY AS t(option, idx)
            WHERE option = question_record.correct_answer
            LIMIT 1;
            
            -- If not found, default to 0
            IF answer_index IS NULL THEN
                answer_index := 0;
            END IF;
        ELSE
            -- Default to 0 if no information available
            answer_index := 0;
        END IF;
        
        -- Update the correct_answer_indices array
        UPDATE questions 
        SET correct_answer_indices = ARRAY[answer_index]
        WHERE id = question_record.id;
    END LOOP;
END $$;

-- Step 5: Make correct_answer_indices NOT NULL after migration
ALTER TABLE questions 
ALTER COLUMN correct_answer_indices SET NOT NULL;

-- Add constraint to ensure at least one correct answer
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS check_correct_answer_indices_not_empty;

ALTER TABLE questions 
ADD CONSTRAINT check_correct_answer_indices_not_empty 
CHECK (array_length(correct_answer_indices, 1) >= 1);

-- Step 6: Update options constraint to allow variable length (minimum 2)
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS check_options_min_length;

ALTER TABLE questions 
ADD CONSTRAINT check_options_min_length 
CHECK (array_length(options, 1) >= 2);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_division ON questions(division);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_stream ON questions(stream);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_questions_stream_subject ON questions(stream, subject);
CREATE INDEX IF NOT EXISTS idx_questions_subject_chapter ON questions(subject, chapter);
CREATE INDEX IF NOT EXISTS idx_questions_stream_division ON questions(stream, division);
CREATE INDEX IF NOT EXISTS idx_questions_status_created ON questions(status, created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_questions_search 
ON questions USING GIN(to_tsvector('english', question));

-- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_questions_institutes_gin ON questions USING GIN(institutes);
CREATE INDEX IF NOT EXISTS idx_questions_years_gin ON questions USING GIN(years);
CREATE INDEX IF NOT EXISTS idx_questions_tags_gin ON questions USING GIN(tags);

-- Step 8: Create or replace updated_at trigger
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_questions_updated_at ON questions;

CREATE TRIGGER set_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_questions_updated_at();

-- Step 9: Add helpful comments to columns
COMMENT ON COLUMN questions.division IS 'Academic division: Science, Arts, Commerce';
COMMENT ON COLUMN questions.correct_answer_indices IS 'Array of indices for correct answers (supports multi-select)';
COMMENT ON COLUMN questions.option_images IS 'Array of image URLs for each option (aligned with options array)';
COMMENT ON COLUMN questions.institutes IS 'Array of institute names';
COMMENT ON COLUMN questions.years IS 'Array of years (e.g., [2023, 2024])';
COMMENT ON COLUMN questions.exam_type IS 'Type of exam (defaults to Academic)';

-- Step 10: Verification queries
-- Run these to verify the migration was successful

-- Check for any questions without correct_answer_indices
SELECT COUNT(*) as questions_without_indices 
FROM questions 
WHERE correct_answer_indices IS NULL 
   OR array_length(correct_answer_indices, 1) IS NULL;

-- Check distribution of questions by division
SELECT division, COUNT(*) as count 
FROM questions 
GROUP BY division 
ORDER BY count DESC;

-- Check for questions with invalid correct answer indices
SELECT id, question, options, correct_answer_indices
FROM questions
WHERE EXISTS (
    SELECT 1 
    FROM unnest(correct_answer_indices) AS idx
    WHERE idx < 0 OR idx >= array_length(options, 1)
)
LIMIT 10;

-- Check exam_type defaults
SELECT exam_type, COUNT(*) as count 
FROM questions 
GROUP BY exam_type 
ORDER BY count DESC;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Next steps:
-- 1. Verify data integrity with the queries above
-- 2. Update application code to use new schema
-- 3. Test thoroughly before deploying to production
-- =====================================================
