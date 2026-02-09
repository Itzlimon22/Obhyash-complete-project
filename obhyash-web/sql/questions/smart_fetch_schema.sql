-- ==========================================
-- Smart Question System: Schema & Indexing
-- ==========================================

-- 1. Add Random Column to Questions Table (for efficient random fetching)
-- This enables O(log N) random access instead of O(N) ORDER BY RANDOM()
ALTER TABLE questions ADD COLUMN IF NOT EXISTS random_id FLOAT DEFAULT random();

-- Index for random seek
CREATE INDEX IF NOT EXISTS idx_questions_random_id ON questions(random_id);

-- Composite index for Subject + Random (most common filter approach)
CREATE INDEX IF NOT EXISTS idx_questions_subject_random ON questions(subject, random_id);

-- 2. Create User Question Analytics Table
-- Tracks every user's interaction with every question
CREATE TABLE IF NOT EXISTS user_question_analytics (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Stats
  times_attempted INT DEFAULT 1,
  times_correct INT DEFAULT 0,
  last_attempted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Computed column: True if the user has NEVER answered it correctly (or has 0 correct count)
  -- This helps easily query "weak" areas
  is_mistaken BOOLEAN GENERATED ALWAYS AS (times_correct = 0) STORED,
  
  PRIMARY KEY (user_id, question_id)
);

-- Index to find mistaken questions quickly for a specific user
CREATE INDEX IF NOT EXISTS idx_uqa_user_mistaken ON user_question_analytics(user_id) WHERE is_mistaken = true;

-- Index to find usage history (for spaced repetition sorting)
CREATE INDEX IF NOT EXISTS idx_uqa_last_attempted ON user_question_analytics(last_attempted_at);

-- 3. RLS Policies (Security)
ALTER TABLE user_question_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics
CREATE POLICY "Users can view their own analytics"
ON user_question_analytics FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert/update their own analytics (system will handle this via RPC/Service)
CREATE POLICY "Users can insert their own analytics"
ON user_question_analytics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
ON user_question_analytics FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Function/Trigger to auto-update Question Analytics from Exam Results?
-- Note: It is usually better to handle this in the Application Layer (Exam Service) 
-- or a specific RPC to "submit_answer_batch" rather than a complex trigger on exam_results,
-- because exam_results is a summary. We need granular question data.
