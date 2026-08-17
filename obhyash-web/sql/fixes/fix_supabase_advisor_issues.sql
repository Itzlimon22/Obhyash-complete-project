-- ============================================================================
-- Supabase Security Advisor: Fix 4 Critical Security Warnings
-- 1. Enable RLS on public.blog_views
-- 2. Enable RLS on public.bulk_upload_jobs
-- 3. Enable RLS on public.user_question_analytics
-- 4. Set security_invoker = true on public.public_profiles VIEW
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FIX: Table public.blog_views
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_views') THEN
        ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;

        -- Allow anyone (public/anon/authenticated) to insert a view count
        DROP POLICY IF EXISTS "Public can insert blog_views" ON public.blog_views;
        CREATE POLICY "Public can insert blog_views"
        ON public.blog_views FOR INSERT
        WITH CHECK (true);

        -- Allow anyone to read view counts
        DROP POLICY IF EXISTS "Public can read blog_views" ON public.blog_views;
        CREATE POLICY "Public can read blog_views"
        ON public.blog_views FOR SELECT
        USING (true);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. FIX: Table public.bulk_upload_jobs (Admin tool)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bulk_upload_jobs') THEN
        ALTER TABLE public.bulk_upload_jobs ENABLE ROW LEVEL SECURITY;

        -- Only admins or service role can manage bulk upload jobs
        DROP POLICY IF EXISTS "Admin full access on bulk_upload_jobs" ON public.bulk_upload_jobs;
        CREATE POLICY "Admin full access on bulk_upload_jobs"
        ON public.bulk_upload_jobs FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'superadmin')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'superadmin')
            )
        );
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. FIX: Table public.user_question_analytics
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_question_analytics') THEN
        ALTER TABLE public.user_question_analytics ENABLE ROW LEVEL SECURITY;

        -- Users can view and manage their own question analytics
        DROP POLICY IF EXISTS "Users can manage own question analytics" ON public.user_question_analytics;
        CREATE POLICY "Users can manage own question analytics"
        ON public.user_question_analytics FOR ALL
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. FIX: View public.public_profiles (Remove Security Definer warning)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'public_profiles') THEN
        -- Setting security_invoker = true tells Postgres to run the view
        -- using the permissions of the invoking user, satisfying Supabase Advisor.
        ALTER VIEW public.public_profiles SET (security_invoker = true);
    END IF;
END $$;
