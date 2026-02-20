-- Force drop to ensure clean slate (avoids schema mismatches with existing tables)
DROP TABLE IF EXISTS public.reports CASCADE;

-- Create Reports Table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id TEXT NOT NULL,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reporter_name TEXT,
  reason TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Resolved', 'Ignored')),
  severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High')),
  resolved_at TIMESTAMPTZ,
  admin_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Admins can do everything
CREATE POLICY "Admins can manage all reports" 
ON public.reports FOR ALL 
USING (public.is_admin());

-- 2. Users can create reports
CREATE POLICY "Users can create reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

-- 3. Users can view their own reports
CREATE POLICY "Users can view own reports" 
ON public.reports FOR SELECT 
USING (auth.uid() = reporter_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_question_id ON public.reports(question_id);
