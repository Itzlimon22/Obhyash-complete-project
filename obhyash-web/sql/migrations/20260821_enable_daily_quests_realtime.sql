-- ==============================================================================
-- Migration: 20260821_enable_daily_quests_realtime.sql
-- Description: Enable Supabase Realtime on daily_quests_state and optimize claim RPC
-- ==============================================================================

-- 1. Ensure daily_quests_state is in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_quests_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_quests_state;
  END IF;
END $$;

-- 2. Set Replica Identity to FULL for accurate realtime payload delivery
ALTER TABLE public.daily_quests_state REPLICA IDENTITY FULL;

-- 3. Composite index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date_claimed 
ON public.daily_quests_state(user_id, quest_date);

-- 4. Robust claim_daily_quest RPC supporting date parameter and timezone safety
CREATE OR REPLACE FUNCTION public.claim_daily_quest(
    p_user_id UUID,
    p_quest_id TEXT,
    p_xp_reward INT,
    p_quest_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_date DATE := COALESCE(p_quest_date, CURRENT_DATE);
    v_state public.daily_quests_state%ROWTYPE;
BEGIN
    -- Look for existing state on target date or today
    SELECT * INTO v_state
    FROM public.daily_quests_state
    WHERE user_id = p_user_id AND (quest_date = v_target_date OR quest_date = CURRENT_DATE)
    ORDER BY (quest_date = v_target_date) DESC, quest_date DESC
    LIMIT 1;

    -- Check if already claimed
    IF v_state.id IS NOT NULL AND v_state.claimed_ids IS NOT NULL AND p_quest_id = ANY(v_state.claimed_ids) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already claimed', 'claimed_ids', v_state.claimed_ids);
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

    -- Award XP atomically to users table
    UPDATE public.users
    SET xp = COALESCE(xp, 0) + p_xp_reward
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'xp_awarded', p_xp_reward, 
        'claimed_ids', v_state.claimed_ids
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_quest(UUID, TEXT, INT, DATE) TO authenticated, anon;
