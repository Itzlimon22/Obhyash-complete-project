-- Run this script in your Supabase SQL Editor

-- 1. Create the new newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active' NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Policy: Anyone can insert a new subscription (anonymous or logged in)
CREATE POLICY "Anyone can subscribe to the newsletter."
ON public.newsletter_subscribers
FOR INSERT 
WITH CHECK (true);

-- Policy: Only service role (admin) can select/read all subscribers
-- Normal users should NOT be able to see other people's emails!
CREATE POLICY "Only admins can view subscribers."
ON public.newsletter_subscribers
FOR SELECT 
USING (
  -- Check if the request is coming from an authenticated service_role (your Next.js backend)
  -- Or if you have a specific admin role defined, you could enforce it here.
  -- For now, we restrict public select. Only your backend API using service_key can read.
  false
);

-- 4. Create an index on email for faster conflict checking
CREATE INDEX idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
