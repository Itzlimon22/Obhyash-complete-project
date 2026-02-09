-- ==========================================
-- AUDIT FIXES: SCHEMA & INDEXES
-- DESCRIPTION: Adds missing columns and performance indexes identified during scale audit.
-- ==========================================

-- 1. QUESTIONS Table: Add random_id for Smart Fetch
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'random_id') THEN
        ALTER TABLE questions ADD COLUMN random_id DOUBLE PRECISION DEFAULT random();
        -- Populate existing rows
        UPDATE questions SET random_id = random() WHERE random_id IS NULL;
    END IF;
END $$;

-- Index for random fetch (O(log N))
CREATE INDEX IF NOT EXISTS idx_questions_random_id ON questions(random_id);

-- 2. USERS Table: Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- Composite index for Leaderboard (Filter by level, Sort by XP)
CREATE INDEX IF NOT EXISTS idx_users_level_xp ON users(level, xp DESC);

-- 3. EXAM_RESULTS Table: Analytics Performance
CREATE INDEX IF NOT EXISTS idx_exam_results_user_date ON exam_results(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_results_status ON exam_results(status);
CREATE INDEX IF NOT EXISTS idx_exam_results_subject ON exam_results(subject);

-- 4. USER_QUESTION_ANALYTICS: Integrity
-- Ensure unique constraint for Upsert logic
ALTER TABLE user_question_analytics 
DROP CONSTRAINT IF EXISTS user_question_analytics_user_id_question_id_key;

ALTER TABLE user_question_analytics
ADD CONSTRAINT user_question_analytics_unq UNIQUE (user_id, question_id);

-- Index for "Unused" check (finding questions NOT in this table)
CREATE INDEX IF NOT EXISTS idx_uqa_user_question ON user_question_analytics(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_uqa_mistaken ON user_question_analytics(user_id, is_mistaken) WHERE is_mistaken = true;

-- 5. REFRESH STATISTICS (Optional but good for planner)
ANALYZE questions;
ANALYZE users;
ANALYZE exam_results;
ANALYZE user_question_analytics;

-- ==========================================
-- Fixes Applied Successfully
-- ==========================================
