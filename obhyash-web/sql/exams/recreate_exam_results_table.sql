-- ==========================================
-- SCRIPT: RECREATE EXAM RESULTS TABLE
-- DESCRIPTION: Recreates exam_results table to fix 400 Bad Request and FK issues.
-- ==========================================

-- 1. DROP EXISTING TABLE
DROP TABLE IF EXISTS public.exam_results CASCADE;

-- 2. CREATE NEW TABLE
CREATE TABLE public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Exam Details
    subject TEXT NOT NULL,
    exam_type TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Scores & Stats
    score DOUBLE PRECISION,
    total_marks DOUBLE PRECISION,
    total_questions INTEGER,
    correct_count INTEGER,
    wrong_count INTEGER,
    time_taken INTEGER, -- Seconds
    negative_marking DOUBLE PRECISION DEFAULT 0,
    
    -- Detailed Data (JSONB for flexibility)
    questions JSONB,
    user_answers JSONB,
    flagged_questions JSONB,
    
    -- script/OMR features
    submission_type TEXT DEFAULT 'digital', -- 'digital', 'script'
    status TEXT DEFAULT 'evaluated', -- 'pending', 'evaluated', 'rejected'
    rejection_reason TEXT,
    script_file TEXT,
    script_image_data TEXT, -- Base64 or URL
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ENABLE RLS
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
CREATE POLICY "Users can view their own results" 
ON public.exam_results FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results" 
ON public.exam_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own results" 
ON public.exam_results FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. TRIGGER FOR EXAMS TAKEN
-- Auto-increment the "exams_taken" count in users table
CREATE OR REPLACE FUNCTION public.increment_exams_taken()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET exams_taken = exams_taken + 1,
      last_active = now()
  WHERE id = new.user_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_exam_result_created
  AFTER INSERT ON public.exam_results
  FOR EACH ROW EXECUTE PROCEDURE public.increment_exams_taken();

-- 6. GRANT PERMISSIONS
GRANT ALL ON TABLE public.exam_results TO anon;
GRANT ALL ON TABLE public.exam_results TO authenticated;
GRANT ALL ON TABLE public.exam_results TO service_role;
