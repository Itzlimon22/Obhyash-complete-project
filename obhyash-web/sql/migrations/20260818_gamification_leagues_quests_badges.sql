-- ==============================================================================
-- Migration: 20260818_gamification_leagues_quests_badges.sql
-- Description: Unlocks, Weekly Leagues (Friday reset), Daily Quests, and Badges
-- ==============================================================================

-- 1. USER BADGES TABLE
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view badges" ON public.user_badges;
CREATE POLICY "Public can view badges" ON public.user_badges
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;
CREATE POLICY "Users can insert own badges" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. DAILY QUESTS STATE TABLE
CREATE TABLE IF NOT EXISTS public.daily_quests_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quests JSONB NOT NULL DEFAULT '[]'::jsonb,
    claimed_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_quest_date UNIQUE (user_id, quest_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON public.daily_quests_state(user_id, quest_date);

ALTER TABLE public.daily_quests_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quests" ON public.daily_quests_state;
CREATE POLICY "Users can view own quests" ON public.daily_quests_state
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own quests" ON public.daily_quests_state;
CREATE POLICY "Users can upsert own quests" ON public.daily_quests_state
    FOR ALL USING (auth.uid() = user_id);

-- 3. RPC: CLAIM DAILY QUEST XP
CREATE OR REPLACE FUNCTION public.claim_daily_quest(
    p_user_id UUID,
    p_quest_id TEXT,
    p_xp_reward INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_state public.daily_quests_state%ROWTYPE;
    v_new_claimed TEXT[];
BEGIN
    -- Check if quest already claimed today
    SELECT * INTO v_state
    FROM public.daily_quests_state
    WHERE user_id = p_user_id AND quest_date = CURRENT_DATE;

    IF v_state.id IS NOT NULL AND p_quest_id = ANY(v_state.claimed_ids) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already claimed');
    END IF;

    -- Update claimed array
    IF v_state.id IS NULL THEN
        INSERT INTO public.daily_quests_state (user_id, quest_date, claimed_ids)
        VALUES (p_user_id, CURRENT_DATE, ARRAY[p_quest_id]);
    ELSE
        UPDATE public.daily_quests_state
        SET claimed_ids = array_append(claimed_ids, p_quest_id),
            updated_at = NOW()
        WHERE id = v_state.id;
    END IF;

    -- Award XP atomically
    UPDATE public.users
    SET xp = COALESCE(xp, 0) + p_xp_reward
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'xp_awarded', p_xp_reward);
END;
$$;

-- 4. WEEKLY LEAGUES (Reset every Friday 00:00 UTC / 06:00 BD time)
CREATE OR REPLACE FUNCTION public.get_weekly_league_standings(
    p_tier TEXT DEFAULT 'all',
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    institute TEXT,
    avatar_url TEXT,
    weekly_xp BIGINT,
    total_xp BIGINT,
    league_tier TEXT,
    rank_number BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_friday TIMESTAMPTZ;
BEGIN
    -- Calculate start of current week (last Friday 00:00:00 BD time)
    -- In PostgreSQL, Friday is DOW 5
    v_last_friday := date_trunc('day', NOW()) - ((EXTRACT(DOW FROM NOW())::int + 2) % 7) * INTERVAL '1 day';

    RETURN QUERY
    WITH weekly_scores AS (
        -- Calculate exam XP in current week
        SELECT 
            er.user_id as u_id,
            SUM(GREATEST(0, (er.correct_count * 10 - er.wrong_count * 2)))::bigint AS w_xp
        FROM public.exam_results er
        WHERE er.created_at >= v_last_friday
        GROUP BY er.user_id
    ),
    user_tiers AS (
        SELECT 
            u.id,
            u.name,
            u.institute,
            u.avatar_url,
            COALESCE(ws.w_xp, 0) AS weekly_xp,
            COALESCE(u.xp, 0) AS total_xp,
            CASE 
                WHEN COALESCE(u.xp, 0) >= 5000 THEN 'apex'
                WHEN COALESCE(u.xp, 0) >= 3500 THEN 'luminary'
                WHEN COALESCE(u.xp, 0) >= 2000 THEN 'conqueror'
                WHEN COALESCE(u.xp, 0) >= 800 THEN 'pioneer'
                ELSE 'seeker'
            END AS calculated_tier
        FROM public.users u
        LEFT JOIN weekly_scores ws ON ws.u_id = u.id
    ),
    ranked AS (
        SELECT 
            ut.id,
            ut.name,
            ut.institute,
            ut.avatar_url,
            ut.weekly_xp,
            ut.total_xp,
            ut.calculated_tier,
            ROW_NUMBER() OVER (
                PARTITION BY (CASE WHEN p_tier = 'all' THEN 'all' ELSE ut.calculated_tier END)
                ORDER BY ut.weekly_xp DESC, ut.total_xp DESC
            ) AS r_num
        FROM user_tiers ut
        WHERE p_tier = 'all' OR ut.calculated_tier = p_tier
    )
    SELECT 
        r.id AS user_id,
        r.name,
        r.institute,
        r.avatar_url,
        r.weekly_xp,
        r.total_xp,
        r.calculated_tier AS league_tier,
        r.r_num AS rank_number
    FROM ranked r
    ORDER BY r.weekly_xp DESC, r.total_xp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
