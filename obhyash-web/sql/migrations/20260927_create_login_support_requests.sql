-- Migration: Create login_support_requests table for guest support tickets
CREATE TABLE IF NOT EXISTS public.login_support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    issue_type TEXT NOT NULL DEFAULT 'Login Issue',
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved', 'Dismissed')),
    admin_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON TABLE public.login_support_requests TO anon, authenticated;
GRANT ALL ON TABLE public.login_support_requests TO service_role;

-- Enable RLS
ALTER TABLE public.login_support_requests ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (guest students without login)
DROP POLICY IF EXISTS "Anyone can submit login support requests" ON public.login_support_requests;
CREATE POLICY "Anyone can submit login support requests"
ON public.login_support_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow admins and service_role to view and update
DROP POLICY IF EXISTS "Admins can view and update login support requests" ON public.login_support_requests;
CREATE POLICY "Admins can view and update login support requests"
ON public.login_support_requests
FOR ALL
USING (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    ))
)
WITH CHECK (
    (auth.jwt() ->> 'role' = 'service_role')
    OR (EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    ))
);

-- Index for speedy queries on status and created_at
CREATE INDEX IF NOT EXISTS idx_login_support_status_created
ON public.login_support_requests (status, created_at DESC);
