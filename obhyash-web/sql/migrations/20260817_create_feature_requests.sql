-- Function to handle updated_at timestamps if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create app_feature_requests table
CREATE TABLE IF NOT EXISTS public.app_feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Exam & Practice', 'Analytics & Tracking', 'Study Tools', 'UI & Theme', 'Other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Under Review' CHECK (status IN ('Under Review', 'Planned', 'In Progress', 'Completed', 'Declined')),
    admin_feedback TEXT,
    upvotes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_feature_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can create their own feature requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own feature requests') THEN
        CREATE POLICY "Users can create their own feature requests" 
        ON public.app_feature_requests FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Users can view their own feature requests or any approved/planned/completed requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view feature requests') THEN
        CREATE POLICY "Users can view feature requests" 
        ON public.app_feature_requests FOR SELECT 
        USING (auth.uid() = user_id OR status IN ('Planned', 'In Progress', 'Completed'));
    END IF;
END $$;

-- 3. Admins can view all feature requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all feature requests') THEN
        CREATE POLICY "Admins can view all feature requests" 
        ON public.app_feature_requests FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'superadmin', 'developer')
            )
        );
    END IF;
END $$;

-- 4. Admins can update feature requests
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update feature requests') THEN
        CREATE POLICY "Admins can update feature requests" 
        ON public.app_feature_requests FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'superadmin', 'developer')
            )
        );
    END IF;
END $$;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS set_feature_requests_updated_at ON public.app_feature_requests;
CREATE TRIGGER set_feature_requests_updated_at
BEFORE UPDATE ON public.app_feature_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
