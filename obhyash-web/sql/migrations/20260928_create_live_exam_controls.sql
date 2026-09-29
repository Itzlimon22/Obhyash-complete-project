-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Live Exam Control Table (Instant Administrative Controls)
-- Obhyash Smart Prep Platform
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.live_exam_controls (
    id TEXT PRIMARY KEY DEFAULT 'global_live_exam_controls',
    is_enabled BOOLEAN DEFAULT TRUE,
    maintenance_message TEXT DEFAULT 'লাইভ এক্সাম সিস্টেম সাময়িকভাবে রক্ষণাবেক্ষণে রয়েছে। শীঘ্রই পরীক্ষা পুনরায় চালু হবে।',
    routine_spreadsheet_id TEXT DEFAULT '1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug',
    routine_sheet_mapping JSONB DEFAULT $${
      "medical": "Medical",
      "engineering": "Engineering",
      "varsity": "Varsity_A",
      "hsc": "HSC",
      "ssc": "SSC"
    }$$::jsonb,
    available_tracks JSONB DEFAULT $$[
      {"key": "Medical", "label": "মেডিকেল ভর্তি", "badge": "MBBS ২০২৬-২৭", "color": "from-emerald-500 to-teal-600", "has_routine": true},
      {"key": "Engineering", "label": "ইঞ্জিনিয়ারিং", "badge": "BUET/CKRUET", "color": "from-blue-500 to-indigo-600", "has_routine": true},
      {"key": "Varsity_A", "label": "ঢাবি 'ক' ইউনিট", "badge": "DU Science", "color": "from-amber-500 to-orange-600", "has_routine": true},
      {"key": "HSC", "label": "এইচএসসি স্পেশাল", "badge": "HSC Board Prep", "color": "from-purple-500 to-indigo-600", "has_routine": false},
      {"key": "SSC", "label": "এসএসসি স্পেশাল", "badge": "SSC Board Prep", "color": "from-rose-500 to-red-600", "has_routine": false}
    ]$$::jsonb,
    anti_cheat_enabled BOOLEAN DEFAULT TRUE,
    max_tab_switches INTEGER DEFAULT 2,
    default_negative_marking NUMERIC(4,2) DEFAULT 0.25,
    allow_practice_mode BOOLEAN DEFAULT TRUE,
    show_routine_button BOOLEAN DEFAULT TRUE,
    active_announcement_enabled BOOLEAN DEFAULT FALSE,
    active_announcement_text TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by TEXT DEFAULT 'admin'
);

-- Insert default single-row record if not exists
INSERT INTO public.live_exam_controls (
    id,
    is_enabled,
    routine_spreadsheet_id,
    anti_cheat_enabled,
    max_tab_switches,
    default_negative_marking,
    allow_practice_mode,
    show_routine_button
)
VALUES (
    'global_live_exam_controls',
    TRUE,
    '1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug',
    TRUE,
    2,
    0.25,
    TRUE,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.live_exam_controls ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (authenticated & anonymous students) can read live exam controls
DROP POLICY IF EXISTS "Allow public read access to live_exam_controls" ON public.live_exam_controls;
CREATE POLICY "Allow public read access to live_exam_controls"
ON public.live_exam_controls FOR SELECT
USING (true);

-- 2. Allow admin and service role full control
DROP POLICY IF EXISTS "Allow admin full access to live_exam_controls" ON public.live_exam_controls;
CREATE POLICY "Allow admin full access to live_exam_controls"
ON public.live_exam_controls FOR ALL
USING (true)
WITH CHECK (true);

-- Enable Realtime publication so Mobile and Web receive instant updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_exam_controls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_exam_controls;
  END IF;
END $$;
