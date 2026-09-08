-- ============================================================================
-- AUTOMATED CONTEXTUAL NOTIFICATION SCHEDULES (CHORCHA & DUOLINGO STYLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'morning', 'afternoon', 'evening', 'night_streak', 'inactivity'
    scheduled_time VARCHAR(10) NOT NULL, -- '07:30', '14:30', '19:30', '22:30' (Asia/Dhaka time)
    is_active BOOLEAN DEFAULT TRUE,
    target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'inactive', 'streak_risk'
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    channel_id VARCHAR(100) DEFAULT 'obhyash_general',
    route VARCHAR(255) DEFAULT '/dashboard',
    priority VARCHAR(50) DEFAULT 'normal',
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Witty Schedules
INSERT INTO public.notification_schedules (name, category, scheduled_time, is_active, title_template, body_template, channel_id, priority)
VALUES
(
    'সকালের চায়ের কুইজ',
    'morning',
    '07:30',
    TRUE,
    'মামা, চোখ খোল! ☀️',
    'চায়ের সাথে ঝটপট একটা ছোট কুইজ খেয়ে নে 🍵⚡',
    'obhyash_general',
    'normal'
),
(
    'ভাতঘুমের অ্যালার্ম',
    'afternoon',
    '14:30',
    TRUE,
    'খাইয়া ঘুম দিলে ভুড়ি বাড়বে! 🍗😴',
    'তার চেয়ে ৩ মিনিটে ৫টা MCQ খেলে ব্রেন ফ্রেশ রাখ 🧠⚡',
    'obhyash_general',
    'normal'
),
(
    'সন্ধ্যার টেবিলে কল',
    'evening',
    '19:30',
    TRUE,
    'পড়ার ভান করিস না! 📖👀',
    'টেবিলে বসে রিলস দেখা বাদ দে, ৫ মিনিটের টেস্টটা দে 🎯',
    'obhyash_general',
    'normal'
),
(
    '১০:৩০ PM স্ট্রিক গিল্ট-ট্রিপ',
    'night_streak',
    '22:30',
    TRUE,
    'কীরে {name}, ঘুমাবি নাকি? 🥱',
    'স্ট্রিকটা তো এতিম হয়ে যাবে দোস্ত! ১টা কুইজ দিয়ে যা 🔥',
    'obhyash_streak_channel',
    'high'
);
