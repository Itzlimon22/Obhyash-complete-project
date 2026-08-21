-- Migration: 20260821_legends_league_system.sql
-- Description: Architecture for Legends League Elimination Tournament (v2)

-- 1. Create legends_league_seasons table
CREATE TABLE IF NOT EXISTS public.legends_league_seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_number INT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    month_year TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'qualifying', 'active', 'completed')),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    total_qualifiers_limit INT DEFAULT 30,
    prize_description TEXT DEFAULT 'গোল্ডেন চ্যাম্পিয়ন ট্রফি, প্রোফাইল সুপ্রিম ব্যাজ ও স্পেশাল প্রাইজ',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create legends_league_qualifiers table
CREATE TABLE IF NOT EXISTS public.legends_league_qualifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.legends_league_seasons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rank_at_qualification INT NOT NULL,
    monthly_xp_at_qualification INT NOT NULL,
    stage TEXT DEFAULT 'round_1' CHECK (stage IN ('qualified', 'round_1', 'semi_final', 'grand_finale', 'eliminated', 'champion')),
    total_score DOUBLE PRECISION DEFAULT 0,
    ticket_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season_id, user_id)
);

-- 3. Create legends_league_exams table
CREATE TABLE IF NOT EXISTS public.legends_league_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES public.legends_league_seasons(id) ON DELETE CASCADE,
    round_number INT DEFAULT 1 CHECK (round_number IN (1, 2, 3)), -- 1: Round 1 (Top 30 -> 15), 2: Semi-Finals (Top 15 -> 5), 3: Grand Finale
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    duration_minutes INT DEFAULT 30,
    total_marks DOUBLE PRECISION DEFAULT 50,
    questions JSONB DEFAULT '[]'::JSONB,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.legends_league_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legends_league_qualifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legends_league_exams ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Anyone can view seasons" ON public.legends_league_seasons;
CREATE POLICY "Anyone can view seasons" ON public.legends_league_seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view qualifiers" ON public.legends_league_qualifiers;
CREATE POLICY "Anyone can view qualifiers" ON public.legends_league_qualifiers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Qualifiers can view active exams" ON public.legends_league_exams;
CREATE POLICY "Qualifiers can view active exams" ON public.legends_league_exams FOR SELECT USING (true);

GRANT SELECT ON public.legends_league_seasons TO authenticated, anon;
GRANT SELECT ON public.legends_league_qualifiers TO authenticated, anon;
GRANT SELECT ON public.legends_league_exams TO authenticated, anon;

-- 6. RPC: Auto Qualify Top Legend Students at Month End
CREATE OR REPLACE FUNCTION public.qualify_monthly_legend_toppers(
    p_season_title TEXT,
    p_month_year TEXT,
    p_limit INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_season_id UUID;
    v_season_number INT;
    v_qualifiers_count INT := 0;
    r RECORD;
    v_rank INT := 1;
BEGIN
    -- Determine season number
    SELECT COALESCE(MAX(season_number), 0) + 1 INTO v_season_number FROM public.legends_league_seasons;

    -- Create new season entry
    INSERT INTO public.legends_league_seasons (
        season_number,
        title,
        month_year,
        status,
        start_time,
        end_time,
        total_qualifiers_limit
    )
    VALUES (
        v_season_number,
        COALESCE(p_season_title, 'লেজেন্ডস লিগ সিজন ' || v_season_number),
        COALESCE(p_month_year, to_char(NOW(), 'Month YYYY')),
        'upcoming',
        date_trunc('month', NOW()),
        date_trunc('month', NOW()) + INTERVAL '15 days',
        p_limit
    )
    RETURNING id INTO v_season_id;

    -- Fetch Top Legend users from monthly_xp
    FOR r IN (
        SELECT id, name, monthly_xp
        FROM public.users
        WHERE level ILIKE '%legend%' OR level ILIKE '%apex%' OR level ILIKE '%scholar%'
        ORDER BY monthly_xp DESC
        LIMIT p_limit
    ) LOOP
        INSERT INTO public.legends_league_qualifiers (
            season_id,
            user_id,
            rank_at_qualification,
            monthly_xp_at_qualification,
            stage,
            ticket_claimed
        )
        VALUES (
            v_season_id,
            r.id,
            v_rank,
            r.monthly_xp,
            'round_1',
            false
        )
        ON CONFLICT (season_id, user_id) DO NOTHING;

        v_rank := v_rank + 1;
        v_qualifiers_count := v_qualifiers_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'season_id', v_season_id,
        'season_number', v_season_number,
        'qualifiers_count', v_qualifiers_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.qualify_monthly_legend_toppers(TEXT, TEXT, INT) TO service_role, authenticated;
