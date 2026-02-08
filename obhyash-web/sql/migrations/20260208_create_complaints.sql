-- Create app_complaints table
CREATE TABLE IF NOT EXISTS public.app_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Technical', 'UX', 'Bug', 'Feature Request', 'Other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Dismissed')),
    admin_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_complaints ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can create their own complaints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own complaints') THEN
        CREATE POLICY "Users can create their own complaints" 
        ON public.app_complaints FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Users can view their own complaints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own complaints') THEN
        CREATE POLICY "Users can view their own complaints" 
        ON public.app_complaints FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. Admins can view all complaints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all complaints') THEN
        CREATE POLICY "Admins can view all complaints" 
        ON public.app_complaints FOR SELECT 
        USING (public.is_admin());
    END IF;
END $$;

-- 4. Admins can update complaints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update complaints') THEN
        CREATE POLICY "Admins can update complaints" 
        ON public.app_complaints FOR UPDATE 
        USING (public.is_admin());
    END IF;
END $$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.app_complaints;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.app_complaints
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
