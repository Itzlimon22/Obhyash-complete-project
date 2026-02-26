-- =====================================================
-- Migration: Add Fingerprint Column for Deduplication
-- =====================================================

-- Step 1: Add fingerprint column
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS fingerprint TEXT;

-- Step 2: Backfill existing fingerprints (optional but recommended)
-- In a real production environment, you would run a script to populate this.
-- For now, we allow NULLs for existing questions or let them be updated later.

-- Step 3: Add unique constraint and index
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_fingerprint_unique ON questions(fingerprint);

COMMENT ON COLUMN questions.fingerprint IS 'Unique hash of question content for deduplication';
