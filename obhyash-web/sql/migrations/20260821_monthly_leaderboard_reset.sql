-- Migration: 20260821_monthly_leaderboard_reset.sql
-- Description: Automated Monthly Leaderboard Reset & Pure Monthly XP Isolation

-- 1. Add monthly_xp and monthly_xp_reset_at to public.users if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS monthly_xp INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_xp_reset_at TIMESTAMPTZ DEFAULT date_trunc('month', NOW());

-- 2. Initialize monthly_xp to current users.xp for the active month
UPDATE public.users
SET 
    monthly_xp = COALESCE(xp, 0),
    monthly_xp_reset_at = date_trunc('month', NOW())
WHERE monthly_xp IS NULL OR monthly_xp_reset_at IS NULL;

-- 3. Safely drop ALL overloaded signatures of increment_user_xp and claim_daily_quest
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'increment_user_xp' 
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;

    FOR r IN (
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'claim_daily_quest' 
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- 4. Create increment_user_xp with atomic Lifetime + Monthly XP rollover
CREATE OR REPLACE FUNCTION public.increment_user_xp(
    uid UUID DEFAULT NULL,
    amount INT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_xp INT DEFAULT NULL,
    p_xp_delta INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_id UUID := COALESCE(uid, p_user_id, auth.uid());
    v_target_amount INT := COALESCE(amount, p_xp, p_xp_delta, 0);
    v_new_xp INT := 0;
BEGIN
    IF v_target_id IS NULL OR v_target_amount <= 0 THEN
        RETURN 0;
    END IF;

    UPDATE public.users
    SET 
        -- Lifetime XP always accumulates (never resets)
        xp = COALESCE(xp, 0) + v_target_amount,
        
        -- Monthly XP resets to v_target_amount if current time is in a new calendar month
        monthly_xp = CASE 
            WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW()) > date_trunc('month', monthly_xp_reset_at)
            THEN v_target_amount
            ELSE COALESCE(monthly_xp, 0) + v_target_amount
        END,
        monthly_xp_reset_at = date_trunc('month', NOW()),
        updated_at = NOW()
    WHERE id = v_target_id
    RETURNING xp INTO v_new_xp;

    RETURN v_new_xp;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_user_xp(UUID, INT, UUID, INT, INT) TO anon, authenticated, service_role;

-- 5. Create claim_daily_quest to also update monthly_xp atomically
CREATE OR REPLACE FUNCTION public.claim_daily_quest(
    p_user_id UUID,
    p_quest_id TEXT,
    p_xp_reward INT,
    p_quest_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_date DATE := COALESCE(p_quest_date, CURRENT_DATE);
    v_state public.daily_quests_state%ROWTYPE;
BEGIN
    -- Check if user is authorized
    IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Not authorized to claim quests for other users';
    END IF;

    -- Fetch current daily state
    SELECT * INTO v_state
    FROM public.daily_quests_state
    WHERE user_id = p_user_id AND quest_date = v_target_date
    FOR UPDATE;

    -- Check if quest is already claimed
    IF v_state.id IS NOT NULL AND v_state.claimed_ids IS NOT NULL AND p_quest_id = ANY(v_state.claimed_ids) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Quest already claimed today',
            'claimed_ids', v_state.claimed_ids
        );
    END IF;

    -- Insert or Update claimed array
    IF v_state.id IS NULL THEN
        INSERT INTO public.daily_quests_state (user_id, quest_date, claimed_ids, updated_at)
        VALUES (p_user_id, v_target_date, ARRAY[p_quest_id], NOW())
        RETURNING * INTO v_state;
    ELSE
        UPDATE public.daily_quests_state
        SET claimed_ids = array_append(COALESCE(claimed_ids, ARRAY[]::TEXT[]), p_quest_id),
            updated_at = NOW()
        WHERE id = v_state.id
        RETURNING * INTO v_state;
    END IF;

    -- Award XP atomically to users table (both lifetime and monthly)
    UPDATE public.users
    SET 
        xp = COALESCE(xp, 0) + p_xp_reward,
        monthly_xp = CASE 
            WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW()) > date_trunc('month', monthly_xp_reset_at)
            THEN p_xp_reward
            ELSE COALESCE(monthly_xp, 0) + p_xp_reward
        END,
        monthly_xp_reset_at = date_trunc('month', NOW()),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'xp_awarded', p_xp_reward, 
        'claimed_ids', v_state.claimed_ids
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_quest(UUID, TEXT, INT, DATE) TO authenticated, anon, service_role;

-- 6. Update public_profiles view to expose monthly_xp safely
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id,
    student_id,
    name,
    avatar_url,
    avatar_color,
    xp, -- Lifetime XP (permanent)
    CASE 
        WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW()) > date_trunc('month', monthly_xp_reset_at)
        THEN 0
        ELSE COALESCE(monthly_xp, 0)
    END AS monthly_xp, -- Pure current calendar month XP
    monthly_xp_reset_at,
    level,
    exams_taken,
    streak,
    institute,
    batch,
    batch_change_count,
    stream,
    role,
    is_subscribed,
    COALESCE(subscription->>'plan', 'Free') AS plan
FROM public.users;

GRANT SELECT ON public.public_profiles TO authenticated, anon;
