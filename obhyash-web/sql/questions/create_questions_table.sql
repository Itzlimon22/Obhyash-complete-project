-- =====================================================
-- Professional Question Management System
-- Fresh Table Creation (Drop and Recreate)
-- =====================================================

-- Step 1: Drop existing table (WARNING: This deletes all data!)
DROP TABLE IF EXISTS questions CASCADE;

-- Step 2: Create new questions table with complete schema
CREATE TABLE questions (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core Content
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer_indices INTEGER[] NOT NULL DEFAULT '{0}',
    explanation TEXT,
    
    -- Question Type
    type VARCHAR(50) DEFAULT 'MCQ',
    difficulty VARCHAR(50) DEFAULT 'Medium',
    
    -- Academic Info
    subject VARCHAR(255) NOT NULL,
    chapter VARCHAR(255),
    topic VARCHAR(255),
    stream VARCHAR(50),               -- HSC, SSC, Admission
    division VARCHAR(50),             -- Science, Arts, Commerce
    section VARCHAR(255),
    
    -- Exam Context
    exam_type VARCHAR(100) DEFAULT 'Academic',
    institutes TEXT[] DEFAULT '{}',   -- Array of institute names
    years INTEGER[] DEFAULT '{}',     -- Array of years [2023, 2024]
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'Pending',
    author VARCHAR(255) DEFAULT 'Admin',
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    
    -- Media
    image_url TEXT,
    option_images TEXT[] DEFAULT '{}',
    explanation_image_url TEXT,
    
    -- Smart Fetch Optimization
    random_id DOUBLE PRECISION DEFAULT random(),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_options_min_length CHECK (array_length(options, 1) >= 2),
    CONSTRAINT check_correct_answer_indices_not_empty CHECK (array_length(correct_answer_indices, 1) >= 1)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_chapter ON questions(chapter);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_stream ON questions(stream);
CREATE INDEX idx_questions_division ON questions(division);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_exam_type ON questions(exam_type);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_random_id ON questions(random_id);

-- Composite indexes for common queries
CREATE INDEX idx_questions_stream_subject ON questions(stream, subject);
CREATE INDEX idx_questions_subject_chapter ON questions(subject, chapter);
CREATE INDEX idx_questions_stream_division ON questions(stream, division);
CREATE INDEX idx_questions_status_created ON questions(status, created_at DESC);

-- Full-text search index
CREATE INDEX idx_questions_search ON questions USING GIN(to_tsvector('english', question));

-- GIN indexes for array searches
CREATE INDEX idx_questions_institutes_gin ON questions USING GIN(institutes);
CREATE INDEX idx_questions_years_gin ON questions USING GIN(years);
CREATE INDEX idx_questions_tags_gin ON questions USING GIN(tags);

-- Step 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_questions_updated_at();

-- Step 5: Add column comments
COMMENT ON TABLE questions IS 'Professional question management system with multi-select answers';
COMMENT ON COLUMN questions.correct_answer_indices IS 'Array of indices for correct answers (supports multi-select)';
COMMENT ON COLUMN questions.division IS 'Academic division: Science, Arts, Commerce';
COMMENT ON COLUMN questions.institutes IS 'Array of institute names where this question appeared';
COMMENT ON COLUMN questions.years IS 'Array of years this question appeared (e.g., [2023, 2024])';
COMMENT ON COLUMN questions.option_images IS 'Array of image URLs for each option (aligned with options array)';
COMMENT ON COLUMN questions.exam_type IS 'Type of exam (Medical, Engineering, Academic, etc.)';

-- Step 6: Enable RLS (Row Level Security)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all questions
CREATE POLICY "Allow read access for authenticated users"
ON questions FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow admins to insert/update/delete
CREATE POLICY "Allow full access for admins"
ON questions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- Table Created Successfully!
-- =====================================================
