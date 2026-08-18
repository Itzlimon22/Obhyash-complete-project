-- ==============================================================================
-- Migration: 10 Essential Master Daily Missions & 2 Daily Random Assignment
-- ==============================================================================

-- 1. Create master_daily_missions table
CREATE TABLE IF NOT EXISTS public.master_daily_missions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- exams_count, correct_answers, streak, accuracy_80, live_or_practice, total_mcqs
    target INT NOT NULL DEFAULT 1,
    xp_reward INT NOT NULL DEFAULT 20,
    icon_name TEXT DEFAULT 'target',
    color_hex TEXT DEFAULT '#004633',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.master_daily_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view master missions" ON public.master_daily_missions;
CREATE POLICY "Public can view master missions" 
    ON public.master_daily_missions FOR SELECT 
    USING (true);

-- 2. Insert 10 Most Essential & Effective Daily Missions for Admission & Prep
INSERT INTO public.master_daily_missions (id, title, description, metric_type, target, xp_reward, icon_name, color_hex)
VALUES
    (
        'mission_exam_1',
        'মডেল টেস্ট চ্যাম্পিয়ন',
        'আজকের যেকোনো ১টি পূর্ণাঙ্গ মডেল টেস্ট বা পরীক্ষা সম্পন্ন করো',
        'exams_count',
        1,
        30,
        'target',
        '#004633'
    ),
    (
        'mission_correct_15',
        'নির্ভুল নিশানাবাজ',
        'আজ কমপক্ষে ১৫টি প্রশ্নের সঠিক উত্তর দাও',
        'correct_answers',
        15,
        25,
        'zap',
        '#B91C1C'
    ),
    (
        'mission_correct_30',
        'মাস্টার ব্রেইন',
        'আজ কমপক্ষে ৩০টি প্রশ্নের সঠিক উত্তর দিয়ে পারদর্শী হও',
        'correct_answers',
        30,
        40,
        'award',
        '#4F46E5'
    ),
    (
        'mission_streak_1',
        'অবিচল অনুশীলন',
        'আজকের ডেইলি পড়ার স্ট্রিক বজায় রাখো',
        'streak',
        1,
        20,
        'flame',
        '#D97706'
    ),
    (
        'mission_exam_2',
        'ডাবল চ্যালেঞ্জ',
        'আজ যেকোনো ২টি ভিন্ন বিষয়ে পরীক্ষা সম্পন্ন করো',
        'exams_count',
        2,
        45,
        'layers',
        '#0F766E'
    ),
    (
        'mission_accuracy_80',
        'পারফেকশনিস্ট',
        'যেকোনো একটি পরীক্ষায় ৮০% বা তার বেশি নির্ভুল স্কোর অর্জন করো',
        'accuracy_80',
        1,
        35,
        'check_circle',
        '#7C3AED'
    ),
    (
        'mission_live_practice',
        'প্রতিযোগিতার মাঠে',
        'আজকের লাইভ এক্সাম বা কোনো অনুশীলনী পরীক্ষায় অংশগ্রহণ করো',
        'live_or_practice',
        1,
        30,
        'trophy',
        '#E11D48'
    ),
    (
        'mission_speed_correct_10',
        'কুইক স্প্রিন্টার',
        'যেকোনো পরীক্ষায় কমপক্ষে ১০টি সঠিক উত্তর দিয়ে সাবমিট করো',
        'correct_answers',
        10,
        20,
        'sparkles',
        '#059669'
    ),
    (
        'mission_solve_40_mcqs',
        'এমসিকিউ ম্যারাথন',
        'আজ সব মিলিয়ে মোট ৪০টি প্রশ্ন সমাধান করো',
        'total_mcqs',
        40,
        40,
        'book_open',
        '#EA580C'
    ),
    (
        'mission_correct_20',
        'লক্ষ্য পূরণ',
        'আজ বিভিন্ন পরীক্ষায় মোট ২০টি প্রশ্নের সঠিক উত্তর দাও',
        'correct_answers',
        20,
        30,
        'compass',
        '#2563EB'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    metric_type = EXCLUDED.metric_type,
    target = EXCLUDED.target,
    xp_reward = EXCLUDED.xp_reward,
    icon_name = EXCLUDED.icon_name,
    color_hex = EXCLUDED.color_hex;

-- 3. Deterministic Daily Mission Assigning Function (Selects 2 Random Missions per day)
CREATE OR REPLACE FUNCTION public.get_or_assign_daily_missions(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_state public.daily_quests_state%ROWTYPE;
    v_missions JSONB;
    v_seed DOUBLE PRECISION;
BEGIN
    -- Check if missions are already assigned for today
    SELECT * INTO v_state
    FROM public.daily_quests_state
    WHERE user_id = p_user_id AND quest_date = p_date;

    IF v_state.id IS NOT NULL AND jsonb_array_length(v_state.quests) > 0 THEN
        RETURN jsonb_build_object(
            'quests', v_state.quests,
            'claimed_ids', COALESCE(v_state.claimed_ids, ARRAY[]::TEXT[])
        );
    END IF;

    -- Pick 2 distinct missions using deterministic hashing per user per date
    SELECT jsonb_agg(to_jsonb(m)) INTO v_missions
    FROM (
        SELECT id, title, description, metric_type, target, xp_reward, icon_name, color_hex
        FROM public.master_daily_missions
        WHERE is_active = TRUE
        ORDER BY hashtext(p_user_id::text || p_date::text || id)
        LIMIT 2
    ) m;

    -- Save in state table
    INSERT INTO public.daily_quests_state (user_id, quest_date, quests, claimed_ids)
    VALUES (p_user_id, p_date, v_missions, ARRAY[]::TEXT[])
    ON CONFLICT (user_id, quest_date) 
    DO UPDATE SET quests = EXCLUDED.quests, updated_at = NOW();

    RETURN jsonb_build_object(
        'quests', v_missions,
        'claimed_ids', ARRAY[]::TEXT[]
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_assign_daily_missions(UUID, DATE) TO anon, authenticated;
