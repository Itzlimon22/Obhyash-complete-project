-- Migration: Create affiliate_applications table
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    age TEXT,
    education TEXT,
    payout_number TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'bKash',
    password_hash TEXT,
    promotion_plan TEXT,
    promotion_channels TEXT,
    social_links TEXT,
    has_experience BOOLEAN DEFAULT false,
    motivation TEXT,
    agreed_terms BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

-- Allow public insertion for application submissions
DROP POLICY IF EXISTS "Anyone can submit affiliate application" ON public.affiliate_applications;
CREATE POLICY "Anyone can submit affiliate application"
ON public.affiliate_applications FOR INSERT
WITH CHECK (true);

-- Allow service_role to read and update
DROP POLICY IF EXISTS "Service role can do everything on affiliate applications" ON public.affiliate_applications;
CREATE POLICY "Service role can do everything on affiliate applications"
ON public.affiliate_applications
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
