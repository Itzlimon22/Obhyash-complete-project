-- =====================================================
-- Obhyash Exam Batch System: GKE Questions Table
-- Dedicated Table for GKE Batch 01 (General Knowledge & English)
-- Matches Obhyash Universal Production Schema
-- =====================================================

CREATE TABLE IF NOT EXISTS public.gke_questions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Batch Context
    batch_name TEXT NOT NULL DEFAULT 'GKE Batch 01',
    category TEXT NOT NULL,                   -- 'English', 'Bangladesh', 'International', 'Model Test'
    sheet_name TEXT NOT NULL,                 -- e.g. 'পাকিস্তান আমল', 'Right Form of Verbs', 'GKE MT 7'
    topic TEXT,

    -- Core Question Content
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,                  -- Array of 4 options
    answer TEXT NOT NULL,                     -- 'A', 'B', 'C', or 'D'
    correct_answer_indices INTEGER[] NOT NULL DEFAULT '{0}', -- [0] for A, [1] for B, [2] for C, [3] for D
    explanation TEXT,

    -- Academic & Reference Meta
    institute_year TEXT,
    difficulty VARCHAR(50) DEFAULT 'Medium',  -- 'Easy', 'Medium', 'Hard'
    type VARCHAR(50) DEFAULT 'MCQ',
    fingerprint TEXT UNIQUE,                  -- SHA-256 hash for deduplication
    status VARCHAR(50) DEFAULT 'Approved',

    -- Random ID for smart shuffling & sampling in live exams
    random_id DOUBLE PRECISION DEFAULT random(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_gke_options_count CHECK (array_length(options, 1) >= 2),
    CONSTRAINT check_gke_correct_indices CHECK (array_length(correct_answer_indices, 1) >= 1)
);

-- =====================================================
-- High-Performance Indexes for Instant Filtering & Shuffling
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_gke_questions_category ON public.gke_questions(category);
CREATE INDEX IF NOT EXISTS idx_gke_questions_sheet_name ON public.gke_questions(sheet_name);
CREATE INDEX IF NOT EXISTS idx_gke_questions_batch_name ON public.gke_questions(batch_name);
CREATE INDEX IF NOT EXISTS idx_gke_questions_difficulty ON public.gke_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_gke_questions_random_id ON public.gke_questions(random_id);
CREATE INDEX IF NOT EXISTS idx_gke_questions_fingerprint ON public.gke_questions(fingerprint);

-- Full-text search index (Supports Bengali & English stems)
CREATE INDEX IF NOT EXISTS idx_gke_questions_search ON public.gke_questions USING GIN(to_tsvector('simple', question));

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_gke_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_gke_questions_updated_at ON public.gke_questions;
CREATE TRIGGER set_gke_questions_updated_at
    BEFORE UPDATE ON public.gke_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_gke_questions_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
ALTER TABLE public.gke_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on gke_questions" ON public.gke_questions;
CREATE POLICY "Allow public read access on gke_questions"
ON public.gke_questions FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow service role full access on gke_questions" ON public.gke_questions;
CREATE POLICY "Allow service role full access on gke_questions"
ON public.gke_questions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

