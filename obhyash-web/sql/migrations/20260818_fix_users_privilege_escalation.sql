-- ==============================================================================
-- Migration: 20260818_fix_users_privilege_escalation.sql
-- Description: Eliminates Client-Side Privilege Escalation on public.users.
-- ==============================================================================

-- 1. Helper function: Check if current caller is an Admin (No recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN TRUE;
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT role INTO v_role 
    FROM public.users 
    WHERE id = auth.uid();

    RETURN (v_role = 'Admin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;


-- 2. Anti-Tamper Trigger Function on public.users
CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_privileged BOOLEAN := FALSE;
BEGIN
    -- Check if caller is Supabase service_role (backend Next.js API / Edge functions)
    IF auth.role() = 'service_role' THEN
        v_is_privileged := TRUE;
    -- Or if caller is an Admin user
    ELSIF public.is_admin() THEN
        v_is_privileged := TRUE;
    END IF;

    -- If caller is a regular user (not admin / not service_role), REVERT all privileged columns
    IF NOT v_is_privileged THEN
        -- Prevent privilege escalation (Admin / Teacher roles)
        NEW.role := OLD.role;
        
        -- Prevent account status modification (Active / Inactive / Suspended / Blocked)
        NEW.status := OLD.status;
        
        -- Prevent free subscription tampering & lifetime access exploits
        NEW.is_subscribed := OLD.is_subscribed;
        NEW.subscription := OLD.subscription;
        NEW.subscription_status := OLD.subscription_status;
        NEW.subscription_expires_at := OLD.subscription_expires_at;
        NEW.plan := OLD.plan;
        
        -- Prevent gamification and stat spoofing
        NEW.level := OLD.level;
        NEW.xp := OLD.xp;
        NEW.streak := OLD.streak;
        
        -- Prevent ID and creation timestamp tampering
        NEW.id := OLD.id;
        NEW.created_at := OLD.created_at;
    END IF;

    -- Always update updated_at timestamp
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

-- 3. Attach BEFORE UPDATE trigger to public.users
DROP TRIGGER IF EXISTS trg_protect_user_privileged_columns ON public.users;
CREATE TRIGGER trg_protect_user_privileged_columns
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_privileged_columns();


-- 4. Secure RLS Policies on public.users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
CREATE POLICY "Users can view profiles"
ON public.users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users"
ON public.users FOR ALL
USING (public.is_admin());
