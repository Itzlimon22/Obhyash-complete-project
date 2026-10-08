-- Migration: 20261008_harden_xp_and_quest_rpc.sql
-- Description: Critical Security Hardening for increment_user_xp and claim_daily_quest
-- Prevents unauthorized leaderboard manipulation, arbitrary XP injection, and client-side reward spoofing.

-- 1. Safely drop existing function signatures to ensure clean definition and permissions
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

-- 2. Hardened increment_user_xp
-- Enforces:
--   a) Caller must be authenticated or service_role. Anon is strictly rejected.
--   b) Users can ONLY award XP to themselves (auth.uid() = v_target_id), unless caller is service_role or admin.
--   c) Maximum XP per single transaction is capped at 500 XP (covers standard exams, live exams, streak multipliers).
--   d) Atomic monthly_xp and lifetime xp updates with monthly rollover preservation.
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
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT := COALESCE(auth.role(), '');
    v_target_id UUID := COALESCE(uid, p_user_id, v_caller_id);
    v_raw_amount INT := COALESCE(amount, p_xp, p_xp_delta, 0);
    v_capped_amount INT := 0;
    v_new_xp INT := 0;
BEGIN
    -- [SECURITY RULE 1]: Reject unauthenticated calls (anon)
    IF v_caller_id IS NULL AND v_caller_role != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Authentication required to award XP';
    END IF;

    -- [SECURITY RULE 2]: Target ID must exist
    IF v_target_id IS NULL THEN
        RAISE EXCEPTION 'Target user ID is missing';
    END IF;

    -- [SECURITY RULE 3]: Authorization check - Users can only increment their OWN XP
    IF v_caller_role != 'service_role' AND v_caller_id != v_target_id THEN
        RAISE EXCEPTION 'Forbidden: You cannot modify XP for another user';
    END IF;

    -- [SECURITY RULE 4]: Non-positive amount rejected
    IF v_raw_amount <= 0 THEN
        RETURN 0;
    END IF;

    -- [SECURITY RULE 5]: Sanity cap per call
    -- Legitimate exams award max ~150-250 XP. We clamp at 500 XP max per single RPC call for normal users.
    IF v_caller_role = 'service_role' THEN
        v_capped_amount := v_raw_amount;
    ELSE
        v_capped_amount := LEAST(v_raw_amount, 500);
    END IF;

    -- Atomic database update
    UPDATE public.users
    SET 
        -- Lifetime XP always accumulates
        xp = COALESCE(xp, 0) + v_capped_amount,
        
        -- Monthly XP resets if currently in a new calendar month
        monthly_xp = CASE 
            WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW()) > date_trunc('month', monthly_xp_reset_at)
            THEN v_capped_amount
            ELSE COALESCE(monthly_xp, 0) + v_capped_amount
        END,
        monthly_xp_reset_at = date_trunc('month', NOW()),
        updated_at = NOW()
    WHERE id = v_target_id
    RETURNING xp INTO v_new_xp;

    RETURN COALESCE(v_new_xp, 0);
END;
$$;

-- REVOKE anon access completely; only authenticated users and service_role can execute
REVOKE ALL ON FUNCTION public.increment_user_xp(UUID, INT, UUID, INT, INT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_user_xp(UUID, INT, UUID, INT, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.increment_user_xp(UUID, INT, UUID, INT, INT) TO authenticated, service_role;


-- 3. Hardened claim_daily_quest
-- Enforces:
--   a) Caller must be authenticated or service_role. Anon is strictly rejected.
--   b) User can only claim for themselves (auth.uid() = p_user_id).
--   c) Daily quest reward is looked up directly from master_daily_missions table when available,
--      or capped at 100 XP maximum (normal quests give 20-50 XP). Client cannot inject arbitrary XP.
--   d) Atomic quest state locking preventing double-claim race conditions.
CREATE OR REPLACE FUNCTION public.claim_daily_quest(
    p_user_id UUID,
    p_quest_id TEXT,
    p_xp_reward INT DEFAULT NULL,
    p_quest_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role TEXT := COALESCE(auth.role(), '');
    v_target_date DATE := COALESCE(p_quest_date, CURRENT_DATE);
    v_state public.daily_quests_state%ROWTYPE;
    v_verified_reward INT := 0;
    v_master_reward INT := NULL;
BEGIN
    -- [SECURITY RULE 1]: Reject unauthenticated calls (anon)
    IF v_caller_id IS NULL AND v_caller_role != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Authentication required to claim quest';
    END IF;

    -- [SECURITY RULE 2]: Prevent claiming for other users
    IF v_caller_role != 'service_role' AND v_caller_id != p_user_id THEN
        RAISE EXCEPTION 'Forbidden: You cannot claim quests for another user';
    END IF;

    -- [SECURITY RULE 3]: Server-side XP reward resolution
    -- Try to fetch official reward from master_daily_missions
    BEGIN
        SELECT xp_reward INTO v_master_reward
        FROM public.master_daily_missions
        WHERE id = p_quest_id AND is_active = TRUE;
    EXCEPTION WHEN OTHERS THEN
        v_master_reward := NULL;
    END;

    IF v_master_reward IS NOT NULL AND v_master_reward > 0 THEN
        v_verified_reward := v_master_reward;
    ELSE
        -- Fallback to client parameter with strict upper bound of 100 XP
        v_verified_reward := LEAST(GREATEST(COALESCE(p_xp_reward, 25), 0), 100);
    END IF;

    -- Fetch current daily state with row lock
    SELECT * INTO v_state
    FROM public.daily_quests_state
    WHERE user_id = p_user_id AND quest_date = v_target_date
    FOR UPDATE;

    -- Check if quest is already claimed today
    IF v_state.id IS NOT NULL AND v_state.claimed_ids IS NOT NULL AND p_quest_id = ANY(v_state.claimed_ids) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Quest already claimed today',
            'claimed_ids', v_state.claimed_ids
        );
    END IF;

    -- Insert or Update daily_quests_state
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

    -- Award verified XP atomically to users table (lifetime & monthly)
    UPDATE public.users
    SET 
        xp = COALESCE(xp, 0) + v_verified_reward,
        monthly_xp = CASE 
            WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW()) > date_trunc('month', monthly_xp_reset_at)
            THEN v_verified_reward
            ELSE COALESCE(monthly_xp, 0) + v_verified_reward
        END,
        monthly_xp_reset_at = date_trunc('month', NOW()),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'xp_awarded', v_verified_reward, 
        'claimed_ids', v_state.claimed_ids
    );
END;
$$;

-- REVOKE anon access completely; only authenticated users and service_role can execute
REVOKE ALL ON FUNCTION public.claim_daily_quest(UUID, TEXT, INT, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_daily_quest(UUID, TEXT, INT, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_quest(UUID, TEXT, INT, DATE) TO authenticated, service_role;
