-- =====================================================
-- Obhyash Written Questions Management System
-- Schema for Written / CQ / Descriptive Questions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.written_questions (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Core Content
    question TEXT NOT NULL,                         -- প্রশ্ন / মূল প্রশ্ন / উদ্দীপক
    explanation TEXT,                                -- সম্পূর্ণ সমাধান / মডেল উত্তর
    
    -- Sub-questions for CQ (সৃজনশীল ক, খ, গ, ঘ) or segmented answers
    sub_questions JSONB DEFAULT '[]'::jsonb,        -- [{"part": "ক", "question": "...", "marks": 1, "answer": "..."}]
    total_marks INTEGER DEFAULT 10,                 -- পূর্ণমান (যেমন: CQ এর জন্য ১০)

    -- Question Classification
    type VARCHAR(50) DEFAULT 'Written',             -- 'Written', 'CQ', 'ShortAnswer'
    difficulty VARCHAR(50) DEFAULT 'Medium',        -- 'Easy', 'Medium', 'Hard'
    
    -- Academic Hierarchy
    stream VARCHAR(50) DEFAULT 'HSC',               -- HSC, SSC, Admission
    division VARCHAR(50) DEFAULT 'Science',         -- Science, Arts, Commerce
    subject VARCHAR(255) NOT NULL,                  -- যেমন: 'রসায়ন ১ম পত্র'
    chapter VARCHAR(255) NOT NULL,                  -- যেমন: 'মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন'
    topic VARCHAR(255),                             -- যেমন: 'ইলেকট্রন বিন্যাস এর ভিত্তিতে মৌলের শ্রেণী বিভাগ'
    
    -- Foreign Taxonomy IDs (Optional / Backward Compatible)
    subject_id VARCHAR(100),
    chapter_id VARCHAR(100),
    topic_id VARCHAR(100),

    -- Exam Context & Board Info
    exam_type VARCHAR(100) DEFAULT 'Academic',      -- Academic, Admission, etc.
    exam_history JSONB DEFAULT '[]'::jsonb,         -- [{"institute": "ঢাকা বোর্ড", "year": 2023}]
    institutes TEXT[] DEFAULT '{}',                 -- ['ঢাকা বোর্ড', 'বুয়েট']
    years INTEGER[] DEFAULT '{}',                   -- [2023, 2024]
    
    -- Deduplication Fingerprint
    fingerprint VARCHAR(64),                        -- md5 hash of question + subject + chapter

    -- Media
    image_url TEXT,                                 -- মূল প্রশ্নের চিত্র
    explanation_image_url TEXT,                     -- সমাধানের চিত্র

    -- Moderation & System Metadata
    status VARCHAR(50) DEFAULT 'Approved',          -- Draft, Pending, Approved, Rejected
    author VARCHAR(255) DEFAULT 'Admin',
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,

    -- Smart Random Fetching
    random_id DOUBLE PRECISION DEFAULT random(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for High Performance Queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_written_questions_subject ON public.written_questions(subject);
CREATE INDEX IF NOT EXISTS idx_written_questions_chapter ON public.written_questions(chapter);
CREATE INDEX IF NOT EXISTS idx_written_questions_topic ON public.written_questions(topic);
CREATE INDEX IF NOT EXISTS idx_written_questions_stream ON public.written_questions(stream);
CREATE INDEX IF NOT EXISTS idx_written_questions_division ON public.written_questions(division);
CREATE INDEX IF NOT EXISTS idx_written_questions_difficulty ON public.written_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_written_questions_status ON public.written_questions(status);
CREATE INDEX IF NOT EXISTS idx_written_questions_random_id ON public.written_questions(random_id);
CREATE INDEX IF NOT EXISTS idx_written_questions_created_at ON public.written_questions(created_at DESC);

-- Composite Indexes
CREATE INDEX IF NOT EXISTS idx_written_stream_subject ON public.written_questions(stream, subject);
CREATE INDEX IF NOT EXISTS idx_written_subject_chapter ON public.written_questions(subject, chapter);
CREATE INDEX IF NOT EXISTS idx_written_stream_division ON public.written_questions(stream, division);

-- GIN Indexes for Array & JSONB Searches
CREATE INDEX IF NOT EXISTS idx_written_exam_history_gin ON public.written_questions USING GIN(exam_history jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_written_institutes_gin ON public.written_questions USING GIN(institutes);
CREATE INDEX IF NOT EXISTS idx_written_years_gin ON public.written_questions USING GIN(years);
CREATE INDEX IF NOT EXISTS idx_written_tags_gin ON public.written_questions USING GIN(tags);

-- Unique Fingerprint index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_written_fingerprint_unique ON public.written_questions(fingerprint) WHERE fingerprint IS NOT NULL;

-- =====================================================
-- Updated At Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_written_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_written_questions_updated_at ON public.written_questions;
CREATE TRIGGER set_written_questions_updated_at
    BEFORE UPDATE ON public.written_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_written_questions_updated_at();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.written_questions ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated & anonymous users
CREATE POLICY "Allow public read access for written questions"
ON public.written_questions FOR SELECT
TO public
USING (true);

-- Allow full access for authenticated/admin users
CREATE POLICY "Allow full access for authenticated users on written questions"
ON public.written_questions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow full access for service_role
CREATE POLICY "Allow service_role full access on written questions"
ON public.written_questions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- Bulk Upload / Merge RPC Function for Written Questions
-- =====================================================
CREATE OR REPLACE FUNCTION public.bulk_upload_written_questions(
  p_questions JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER := array_length(p_questions, 1);
  v_inserted INTEGER := 0;
  v_duplicates INTEGER := 0;
  v_question JSONB;
  v_question_text TEXT;
  v_subject TEXT;
  v_chapter TEXT;
  v_fingerprint TEXT;
BEGIN
  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('success', true, 'total', 0, 'inserted', 0, 'duplicates', 0);
  END IF;

  FOR i IN 1..v_total LOOP
    v_question := p_questions[i];
    v_question_text := trim(COALESCE(v_question->>'question', ''));
    v_subject := trim(COALESCE(v_question->>'subject', ''));
    v_chapter := trim(COALESCE(v_question->>'chapter', ''));

    -- Generate fingerprint if not provided
    v_fingerprint := COALESCE(
      v_question->>'fingerprint',
      md5(v_subject || '|' || v_chapter || '|' || v_question_text)
    );

    -- Check for duplicates
    IF EXISTS (SELECT 1 FROM public.written_questions WHERE fingerprint = v_fingerprint) THEN
      v_duplicates := v_duplicates + 1;
    ELSE
      INSERT INTO public.written_questions (
        question,
        explanation,
        sub_questions,
        total_marks,
        type,
        difficulty,
        stream,
        division,
        subject,
        chapter,
        topic,
        exam_type,
        institutes,
        years,
        exam_history,
        fingerprint,
        image_url,
        explanation_image_url,
        status,
        author
      ) VALUES (
        v_question_text,
        v_question->>'explanation',
        COALESCE(v_question->'sub_questions', '[]'::jsonb),
        COALESCE((v_question->>'total_marks')::INTEGER, 10),
        COALESCE(v_question->>'type', 'Written'),
        COALESCE(v_question->>'difficulty', 'Medium'),
        COALESCE(v_question->>'stream', 'HSC'),
        COALESCE(v_question->>'division', 'Science'),
        v_subject,
        v_chapter,
        v_question->>'topic',
        COALESCE(v_question->>'exam_type', 'Academic'),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_question->'institutes', '[]'::jsonb))), '{}'::TEXT[]),
        COALESCE(ARRAY(SELECT (jsonb_array_elements(COALESCE(v_question->'years', '[]'::jsonb)))::INTEGER), '{}'::INTEGER[]),
        COALESCE(v_question->'exam_history', '[]'::jsonb),
        v_fingerprint,
        v_question->>'image_url',
        v_question->>'explanation_image_url',
        COALESCE(v_question->>'status', 'Approved'),
        COALESCE(v_question->>'author', 'Admin')
      );
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total', v_total,
    'inserted', v_inserted,
    'duplicates', v_duplicates
  );
END;
$$;

