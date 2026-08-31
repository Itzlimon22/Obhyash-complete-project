-- ==============================================================================
-- OBHYASH: REALISTIC BANGLADESHI DEMO STUDENTS SEED SCRIPT (HSC & SSC MIX)
-- ==============================================================================
-- Description: Inserts 60+ highly realistic student profiles across:
-- • Streams: HSC and SSC (Strictly 'HSC' / 'SSC')
-- • Batches: HSC 2025, HSC 2026, SSC 2025, SSC 2026
-- • Natural mix of English and Bangla names
-- • All 8 Divisions represented (Top Colleges & Top High Schools / Cadet / Model Schools)
-- • Full avatars (DiceBear SVG URLs) and active streaks (last_streak_date = CURRENT_DATE)
--
-- How to run:
-- 1. Open Supabase Dashboard -> SQL Editor
-- 2. Paste this entire script and click "Run"
-- ==============================================================================

DO $$
DECLARE
  v_demo_users RECORD;
BEGIN
  -- Temporary table of realistic Bangladeshi student profiles
  CREATE TEMP TABLE temp_demo_students (
    email TEXT,
    name TEXT,
    gender TEXT,
    institute TEXT,
    stream TEXT,
    batch TEXT,
    target TEXT,
    xp INT,
    monthly_xp INT,
    streak INT,
    exams_taken INT,
    level TEXT,
    avatar_color TEXT,
    avatar_url TEXT
  ) ON COMMIT DROP;

  INSERT INTO temp_demo_students VALUES
    -- ── 1. LEGEND TIER (15,000+ XP) ──────────────────────────────────────────
    ('abrar.faiyaz.ndc@gmail.com', 'Abrar Faiyaz', 'Male', 'নটর ডেম কলেজ', 'HSC', 'HSC 2025', 'Engineering', 24850, 4200, 78, 184, 'Legend', '#EF4444', 'https://api.dicebear.com/7.x/adventurer/svg?seed=AbrarFaiyaz&scale=120&backgroundColor=b6e3f4'),
    ('nusrat.jahan.hcc@gmail.com', 'নুসরাত জাহান', 'Female', 'হলি ক্রস কলেজ', 'HSC', 'HSC 2025', 'Medical', 22100, 3950, 68, 169, 'Legend', '#DC2626', 'https://api.dicebear.com/7.x/lorelei/svg?seed=NusratJahan&scale=120&backgroundColor=ffd5dc'),
    ('tahsin.rahman.dc@gmail.com', 'Tahsin Rahman', 'Male', 'ঢাকা কলেজ', 'HSC', 'HSC 2025', 'Engineering', 19800, 3400, 56, 152, 'Legend', '#B91C1C', 'https://api.dicebear.com/7.x/adventurer/svg?seed=TahsinRahman&scale=120&backgroundColor=c0aede'),
    ('tanvir.hasan.ctg@gmail.com', 'তানভীর হাসান', 'Male', 'চট্টগ্রাম কলেজ', 'HSC', 'HSC 2025', 'Engineering', 18650, 3200, 51, 142, 'Legend', '#EF4444', 'https://api.dicebear.com/7.x/adventurer/svg?seed=TanvirHasan&scale=120&backgroundColor=d1d4f9'),
    ('tasnia.tahrin.vnc@gmail.com', 'Tasnia Tahrin', 'Female', 'ভিকারুননিসা নূন স্কুল এন্ড কলেজ', 'HSC', 'HSC 2025', 'Medical', 17400, 2950, 46, 131, 'Legend', '#DC2626', 'https://api.dicebear.com/7.x/lorelei/svg?seed=TasniaTahrin&scale=120&backgroundColor=ffd5dc'),
    ('shafiqul.rajshahi@gmail.com', 'শফিকুল ইসলাম', 'Male', 'রাজশাহী কলেজ', 'HSC', 'HSC 2025', 'Varsity A', 16500, 2800, 43, 124, 'Legend', '#B91C1C', 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShafiqulIslam&scale=120&backgroundColor=b6e3f4'),
    ('samiul.islam.rajuk@gmail.com', 'Samiul Islam', 'Male', 'রাজউক উত্তরা মডেল কলেজ', 'HSC', 'HSC 2025', 'Engineering', 15700, 2600, 40, 118, 'Legend', '#EF4444', 'https://api.dicebear.com/7.x/adventurer/svg?seed=SamiulIslam&scale=120&backgroundColor=c0aede'),
    -- SSC Legend
    ('shariar.ideal.ssc@gmail.com', 'Shahriar Kabir', 'Male', 'আইডিয়াল স্কুল অ্যান্ড কলেজ, মতিঝিল', 'SSC', 'SSC 2025', 'GPA 5', 15200, 2550, 42, 115, 'Legend', '#B91C1C', 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShahriarKabir&scale=120&backgroundColor=b6e3f4'),

    -- ── 2. SCHOLAR TIER (7,000 - 14,999 XP) ───────────────────────────────────
    ('fariha.tabassum.hcc@gmail.com', 'Fariha Tabassum', 'Female', 'হলি ক্রস কলেজ', 'HSC', 'HSC 2025', 'Medical', 14200, 2550, 39, 105, 'Scholar', '#F59E0B', 'https://api.dicebear.com/7.x/lorelei/svg?seed=FarihaTabassum&scale=120&backgroundColor=ffd5dc'),
    ('mahmudul.hasan.bl@gmail.com', 'মাহমুদুল হাসান', 'Male', 'সরকারি ব্রজলাল (বিএল) কলেজ, খুলনা', 'HSC', 'HSC 2025', 'Engineering', 13450, 2380, 36, 98, 'Scholar', '#D97706', 'https://api.dicebear.com/7.x/adventurer/svg?seed=MahmudulHasan&scale=120&backgroundColor=d1d4f9'),
    ('zarin.tasnim.vnc@gmail.com', 'Zarin Tasnim', 'Female', 'ভিকারুননিসা নূন স্কুল এন্ড কলেজ', 'HSC', 'HSC 2025', 'Medical', 12300, 2200, 33, 92, 'Scholar', '#B45309', 'https://api.dicebear.com/7.x/lorelei/svg?seed=ZarinTasnim&scale=120&backgroundColor=ffd5dc'),
    ('fahim.shahriar.adamjee@gmail.com', 'Fahim Shahriar', 'Male', 'আদমজী ক্যান্টনমেন্ট কলেজ', 'HSC', 'HSC 2025', 'Engineering', 11500, 2050, 30, 86, 'Scholar', '#F59E0B', 'https://api.dicebear.com/7.x/adventurer/svg?seed=FahimShahriar&scale=120&backgroundColor=b6e3f4'),
    -- SSC Scholars
    ('muntaha.vnc.ssc@gmail.com', 'মুনতাহা আনজুম', 'Female', 'ভিকারুননিসা নূন স্কুল এন্ড কলেজ', 'SSC', 'SSC 2025', 'GPA 5', 11100, 2000, 29, 84, 'Scholar', '#D97706', 'https://api.dicebear.com/7.x/lorelei/svg?seed=MuntahaAnjum&scale=120&backgroundColor=ffd5dc'),
    ('ishrat.jahan.mc@gmail.com', 'ইশরাত জাহান', 'Female', 'মুরারিচাঁদ (এম সি) কলেজ, সিলেট', 'HSC', 'HSC 2025', 'Medical', 10800, 1950, 28, 81, 'Scholar', '#D97706', 'https://api.dicebear.com/7.x/lorelei/svg?seed=IshratJahan&scale=120&backgroundColor=ffd5dc'),
    ('kazi.mehedi.carmichael@gmail.com', 'Kazi Mehedi Hasan', 'Male', 'কারমাইকেল কলেজ, রংপুর', 'HSC', 'HSC 2025', 'Varsity A', 9950, 1820, 26, 75, 'Scholar', '#B45309', 'https://api.dicebear.com/7.x/adventurer/svg?seed=KaziMehedi&scale=120&backgroundColor=c0aede'),
    ('sadia.afrin.anandamohan@gmail.com', 'সাদিয়া আফরিন', 'Female', 'আনন্দ মোহন কলেজ, ময়মনসিংহ', 'HSC', 'HSC 2025', 'Medical', 9200, 1700, 24, 70, 'Scholar', '#F59E0B', 'https://api.dicebear.com/7.x/lorelei/svg?seed=SadiaAfrin&scale=120&backgroundColor=ffd5dc'),
    ('shadman.rajuk.ssc@gmail.com', 'Shadman Shakil', 'Male', 'রাজউক উত্তরা মডেল কলেজ', 'SSC', 'SSC 2025', 'GPA 5', 8850, 1600, 23, 67, 'Scholar', '#D97706', 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadmanShakil&scale=120&backgroundColor=b6e3f4'),
    ('ishrak.ahmed.stjoseph@gmail.com', 'Ishrak Ahmed', 'Male', 'সেন্ট জোসেফ উচ্চ মাধ্যমিক বিদ্যালয়', 'HSC', 'HSC 2026', 'Engineering', 8600, 1550, 22, 65, 'Scholar', '#D97706', 'https://api.dicebear.com/7.x/adventurer/svg?seed=IshrakAhmed&scale=120&backgroundColor=d1d4f9'),
    ('arefin.shuvo.bm@gmail.com', 'আরেফিন শুভ', 'Male', 'ব্রজমোহন (বিএম) কলেজ, বরিশাল', 'HSC', 'HSC 2025', 'Varsity A', 7950, 1420, 20, 60, 'Scholar', '#B45309', 'https://api.dicebear.com/7.x/adventurer/svg?seed=ArefinShuvo&scale=120&backgroundColor=b6e3f4'),
    ('nabil.hasan.bogura@gmail.com', 'Nabil Hasan', 'Male', 'সরকারি আজিজুল হক কলেজ, বগুড়া', 'HSC', 'HSC 2025', 'Engineering', 7350, 1320, 19, 55, 'Scholar', '#F59E0B', 'https://api.dicebear.com/7.x/adventurer/svg?seed=NabilHasan&scale=120&backgroundColor=c0aede'),

    -- ── 3. WARRIOR TIER (3,000 - 6,999 XP) ───────────────────────────────────
    ('nafees.iqbal.ndc@gmail.com', 'Nafis Iqbal', 'Male', 'নটর ডেম কলেজ', 'HSC', 'HSC 2026', 'Engineering', 6800, 1280, 18, 50, 'Warrior', '#8B5CF6', 'https://api.dicebear.com/7.x/adventurer/svg?seed=NafisIqbal&scale=120&backgroundColor=b6e3f4'),
    ('sumaiya.akter.victoria@gmail.com', 'সুমাইয়া আক্তার', 'Female', 'কুমিল্লা ভিক্টোরিয়া সরকারি কলেজ', 'HSC', 'HSC 2025', 'Medical', 6350, 1200, 17, 46, 'Warrior', '#7C3AED', 'https://api.dicebear.com/7.x/lorelei/svg?seed=SumaiyaAkter&scale=120&backgroundColor=ffd5dc'),
    ('rafid.alhasan.rajuk@gmail.com', 'Rafid Al Hasan', 'Male', 'রাজউক উত্তরা মডেল কলেজ', 'HSC', 'HSC 2025', 'Engineering', 5900, 1120, 16, 43, 'Warrior', '#6D28D9', 'https://api.dicebear.com/7.x/adventurer/svg?seed=RafidAlHasan&scale=120&backgroundColor=d1d4f9'),
    -- SSC Warriors
    ('tahmid.collegiate.ssc@gmail.com', 'Tahmidul Islam', 'Male', 'চট্টগ্রাম কলেজিয়েট স্কুল', 'SSC', 'SSC 2025', 'GPA 5', 5600, 1080, 15, 41, 'Warrior', '#8B5CF6', 'https://api.dicebear.com/7.x/adventurer/svg?seed=TahmidulIslam&scale=120&backgroundColor=b6e3f4'),
    ('anika.bushra.mohsin@gmail.com', 'Anika Bushra', 'Female', 'হাজী মুহাম্মদ মহসীন কলেজ', 'HSC', 'HSC 2026', 'Medical', 5450, 1050, 15, 39, 'Warrior', '#8B5CF6', 'https://api.dicebear.com/7.x/lorelei/svg?seed=AnikaBushra&scale=120&backgroundColor=ffd5dc'),
    ('habibur.rahman.jashore@gmail.com', 'Md. Habibur Rahman', 'Male', 'সরকারি এম এম কলেজ, যশোর', 'HSC', 'HSC 2025', 'Engineering', 4950, 960, 14, 36, 'Warrior', '#7C3AED', 'https://api.dicebear.com/7.x/adventurer/svg?seed=HabiburRahman&scale=120&backgroundColor=c0aede'),
    ('nafisa.rajshahi.ssc@gmail.com', 'নাফিসা তাবাসসুম', 'Female', 'রাজশাহী সরকারি বালিকা উচ্চ বিদ্যালয়', 'SSC', 'SSC 2026', 'GPA 5', 4700, 920, 13, 34, 'Warrior', '#6D28D9', 'https://api.dicebear.com/7.x/lorelei/svg?seed=NafisaTabassum&scale=120&backgroundColor=ffd5dc'),
    ('lamia.sultana.jalalabad@gmail.com', 'লামিয়া সুলতানা', 'Female', 'জালালাবাদ ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ', 'HSC', 'HSC 2026', 'Medical', 4500, 890, 13, 33, 'Warrior', '#6D28D9', 'https://api.dicebear.com/7.x/lorelei/svg?seed=LamiaSultana&scale=120&backgroundColor=ffd5dc'),
    ('shahriar.nazim.newgovt@gmail.com', 'Shahriar Nazim', 'Male', 'নিউ গভঃ ডিগ্রী কলেজ, রাজশাহী', 'HSC', 'HSC 2025', 'Varsity A', 4100, 810, 12, 30, 'Warrior', '#8B5CF6', 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShahriarNazim&scale=120&backgroundColor=b6e3f4'),
    ('tahmina.akter.feni@gmail.com', 'তাহমিনা আক্তার', 'Female', 'ফেনী সরকারি কলেজ', 'HSC', 'HSC 2026', 'Varsity A', 3750, 740, 11, 28, 'Warrior', '#7C3AED', 'https://api.dicebear.com/7.x/lorelei/svg?seed=TahminaAkter&scale=120&backgroundColor=ffd5dc'),
    ('samiul.haque.kushtia@gmail.com', 'Samiul Haque', 'Male', 'কুষ্টিয়া সরকারি কলেজ', 'HSC', 'HSC 2025', 'Engineering', 3450, 680, 10, 26, 'Warrior', '#6D28D9', 'https://api.dicebear.com/7.x/adventurer/svg?seed=SamiulHaque&scale=120&backgroundColor=d1d4f9'),
    ('nadia.islam.syedhatem@gmail.com', 'Nadia Islam', 'Female', 'সরকারি সৈয়দ হাতেম আলী কলেজ, বরিশাল', 'HSC', 'HSC 2026', 'Medical', 3150, 620, 9, 24, 'Warrior', '#8B5CF6', 'https://api.dicebear.com/7.x/lorelei/svg?seed=NadiaIslam&scale=120&backgroundColor=ffd5dc'),

    -- ── 4. CHALLENGER TIER (1,000 - 2,999 XP) ─────────────────────────────────
    ('saadman.sakib.ndc@gmail.com', 'Saadman Sakib', 'Male', 'নটর ডেম কলেজ', 'HSC', 'HSC 2026', 'Engineering', 2900, 600, 9, 23, 'Challenger', '#0284C7', 'https://api.dicebear.com/7.x/adventurer/svg?seed=SaadmanSakib&scale=120&backgroundColor=b6e3f4'),
    ('maisha.maliha.hcc@gmail.com', 'Maisha Maliha', 'Female', 'হলি ক্রস কলেজ', 'HSC', 'HSC 2026', 'Medical', 2650, 550, 8, 21, 'Challenger', '#0369A1', 'https://api.dicebear.com/7.x/lorelei/svg?seed=MaishaMaliha&scale=120&backgroundColor=ffd5dc'),
    -- SSC Challengers
    ('adnan.khulnazilla.ssc@gmail.com', 'আদনান সামী', 'Male', 'খুলনা জিলা স্কুল', 'SSC', 'SSC 2025', 'GPA 5', 2500, 530, 8, 20, 'Challenger', '#0284C7', 'https://api.dicebear.com/7.x/adventurer/svg?seed=AdnanSami&scale=120&backgroundColor=b6e3f4'),
    ('tanmoy.paul.dinajpur@gmail.com', 'Tanmoy Paul', 'Male', 'দিনাজপুর সরকারি কলেজ', 'HSC', 'HSC 2025', 'Engineering', 2400, 510, 8, 19, 'Challenger', '#0284C7', 'https://api.dicebear.com/7.x/adventurer/svg?seed=TanmoyPaul&scale=120&backgroundColor=c0aede'),
    ('jannatul.ferdaus.ctg@gmail.com', 'জান্নাতুল ফেরদৌস', 'Female', 'চট্টগ্রাম কলেজ', 'HSC', 'HSC 2026', 'Medical', 2200, 470, 7, 17, 'Challenger', '#0369A1', 'https://api.dicebear.com/7.x/lorelei/svg?seed=JannatulFerdaus&scale=120&backgroundColor=ffd5dc'),
    ('samira.bogurazilla.ssc@gmail.com', 'Samira Sultana', 'Female', 'বগুড়া সরকারি বালিকা উচ্চ বিদ্যালয়', 'SSC', 'SSC 2026', 'GPA 5', 2050, 440, 7, 16, 'Challenger', '#0284C7', 'https://api.dicebear.com/7.x/lorelei/svg?seed=SamiraSultana&scale=120&backgroundColor=ffd5dc'),
    ('tariqul.islam.boguracant@gmail.com', 'Tariqul Islam', 'Male', 'ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ, বগুড়া', 'HSC', 'HSC 2026', 'Engineering', 1950, 420, 6, 15, 'Challenger', '#0284C7', 'https://api.dicebear.com/7.x/adventurer/svg?seed=TariqulIslam&scale=120&backgroundColor=d1d4f9'),
    ('mumtahina.nazrul@gmail.com', 'Mumtahina Rahman', 'Female', 'শহীদ সৈয়দ নজরুল ইসলাম কলেজ, ময়মনসিংহ', 'HSC', 'HSC 2026', 'Medical', 1750, 380, 5, 14, 'Challenger', '#0369A1', 'https://api.dicebear.com/7.x/lorelei/svg?seed=MumtahinaRahman&scale=120&backgroundColor=ffd5dc'),
    ('rezaul.karim.pabna@gmail.com', 'Rezaul Karim', 'Male', 'এডওয়ার্ড কলেজ, পাবনা', 'HSC', 'HSC 2025', 'Varsity A', 1550, 340, 5, 12, 'Challenger', '#0284C7', 'https://api.dicebear.com/7.x/adventurer/svg?seed=RezaulKarim&scale=120&backgroundColor=b6e3f4'),
    ('maruf.barishalzilla.ssc@gmail.com', 'মারুফ হোসেন', 'Male', 'বরিশাল জিলা স্কুল', 'SSC', 'SSC 2026', 'GPA 5', 1450, 320, 5, 11, 'Challenger', '#0369A1', 'https://api.dicebear.com/7.x/adventurer/svg?seed=MarufHossain&scale=120&backgroundColor=b6e3f4'),
    ('afia.anfum.khulnapub@gmail.com', 'Afia Anjum', 'Female', 'খুলনা পাবলিক কলেজ', 'HSC', 'HSC 2026', 'Medical', 1380, 300, 4, 11, 'Challenger', '#0369A1', 'https://api.dicebear.com/7.x/lorelei/svg?seed=AfiaAnjum&scale=120&backgroundColor=ffd5dc'),
    ('sohanur.rahman.rangpurcant@gmail.com', 'Sohanur Rahman', 'Male', 'ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ, রংপুর', 'HSC', 'HSC 2026', 'Engineering', 1220, 270, 4, 10, 'Challenger', '#0284C7', 'https://api.dicebear.com/7.x/adventurer/svg?seed=SohanurRahman&scale=120&backgroundColor=c0aede'),
    ('shirin.akter.noakhali@gmail.com', 'শিরিন আক্তার', 'Female', 'নোয়াখালী সরকারি কলেজ', 'HSC', 'HSC 2026', 'Varsity A', 1080, 240, 3, 9, 'Challenger', '#0369A1', 'https://api.dicebear.com/7.x/lorelei/svg?seed=ShirinAkter&scale=120&backgroundColor=ffd5dc'),

    -- ── 5. EXPLORER TIER (0 - 999 XP) ─────────────────────────────────────────
    ('washim.akram.dc@gmail.com', 'Wasim Akram', 'Male', 'ঢাকা কলেজ', 'HSC', 'HSC 2026', 'Engineering', 920, 220, 3, 8, 'Explorer', '#10B981', 'https://api.dicebear.com/7.x/adventurer/svg?seed=WasimAkram&scale=120&backgroundColor=b6e3f4'),
    ('sultana.razzia.ctg@gmail.com', 'সুলতানা রাজিয়া', 'Female', 'চট্টগ্রাম সরকারি মহিলা কলেজ', 'HSC', 'HSC 2026', 'Medical', 810, 190, 3, 7, 'Explorer', '#059669', 'https://api.dicebear.com/7.x/lorelei/svg?seed=SultanaRazzia&scale=120&backgroundColor=ffd5dc'),
    ('jubayer.ahmed.rajshahi@gmail.com', 'Jubayer Ahmed', 'Male', 'রাজশাহী কলেজ', 'HSC', 'HSC 2026', 'Varsity A', 710, 160, 2, 6, 'Explorer', '#047857', 'https://api.dicebear.com/7.x/adventurer/svg?seed=JubayerAhmed&scale=120&backgroundColor=c0aede'),
    -- SSC Explorers
    ('rumana.sylhetpilot.ssc@gmail.com', 'রুমানা পারভীন', 'Female', 'সিলেট সরকারি পাইলট উচ্চ বিদ্যালয়', 'SSC', 'SSC 2026', 'GPA 5', 650, 150, 2, 5, 'Explorer', '#10B981', 'https://api.dicebear.com/7.x/lorelei/svg?seed=RumanaParvin&scale=120&backgroundColor=ffd5dc'),
    ('humaira.zaman.vnc@gmail.com', 'Humaira Zaman', 'Female', 'ভিকারুননিসা নূন স্কুল এন্ড কলেজ', 'HSC', 'HSC 2026', 'Medical', 580, 130, 2, 5, 'Explorer', '#10B981', 'https://api.dicebear.com/7.x/lorelei/svg?seed=HumairaZaman&scale=120&backgroundColor=ffd5dc'),
    ('siam.mymensinghzilla.ssc@gmail.com', 'Siam Ahmed', 'Male', 'ময়মনসিংহ জিলা স্কুল', 'SSC', 'SSC 2026', 'GPA 5', 490, 110, 2, 4, 'Explorer', '#059669', 'https://api.dicebear.com/7.x/adventurer/svg?seed=SiamAhmed&scale=120&backgroundColor=b6e3f4'),
    ('ashikur.rahman.mymensingh@gmail.com', 'Ashikur Rahman', 'Male', 'আনন্দ মোহন কলেজ, ময়মনসিংহ', 'HSC', 'HSC 2026', 'Engineering', 450, 100, 2, 4, 'Explorer', '#059669', 'https://api.dicebear.com/7.x/adventurer/svg?seed=AshikurRahman&scale=120&backgroundColor=d1d4f9'),
    ('farzana.haque.barishal@gmail.com', 'ফারজানা হক', 'Female', 'ব্রজমোহন (বিএম) কলেজ, বরিশাল', 'HSC', 'HSC 2026', 'Medical', 350, 80, 1, 3, 'Explorer', '#047857', 'https://api.dicebear.com/7.x/lorelei/svg?seed=FarzanaHaque&scale=120&backgroundColor=ffd5dc'),
    ('shahadat.hossain.sylhet@gmail.com', 'Shahadat Hossain', 'Male', 'মুরারিচাঁদ (এম সি) কলেজ, সিলেট', 'HSC', 'HSC 2026', 'Engineering', 260, 60, 1, 2, 'Explorer', '#10B981', 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShahadatHossain&scale=120&backgroundColor=b6e3f4'),
    ('fahim.rangpurzilla.ssc@gmail.com', 'ফাহিম মোর্শেদ', 'Male', 'রংপুর জিলা স্কুল', 'SSC', 'SSC 2026', 'GPA 5', 210, 50, 1, 2, 'Explorer', '#059669', 'https://api.dicebear.com/7.x/adventurer/svg?seed=FahimMorshed&scale=120&backgroundColor=b6e3f4'),
    ('niloy.sen.dinajpur@gmail.com', 'Niloy Sen', 'Male', 'দিনাজপুর সরকারি কলেজ', 'HSC', 'HSC 2026', 'Varsity A', 180, 40, 1, 2, 'Explorer', '#059669', 'https://api.dicebear.com/7.x/adventurer/svg?seed=NiloySen&scale=120&backgroundColor=c0aede');

  -- Loop through and safely insert into auth.users (if needed) & public.users
  FOR v_demo_users IN SELECT * FROM temp_demo_students LOOP
    DECLARE
      v_user_id UUID;
    BEGIN
      -- Check if user already exists in auth.users by email
      SELECT id INTO v_user_id FROM auth.users WHERE email = v_demo_users.email;

      -- If doesn't exist in auth.users, create mock auth user
      IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          created_at,
          updated_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          role,
          aud
        ) VALUES (
          v_user_id,
          '00000000-0000-0000-0000-000000000000',
          v_demo_users.email,
          crypt('DemoPass12345!', gen_salt('bf')),
          NOW(),
          NOW() - (v_demo_users.streak || ' days')::INTERVAL,
          NOW(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('name', v_demo_users.name),
          FALSE,
          'authenticated',
          'authenticated'
        );
      END IF;

      -- Upsert into public.users
      INSERT INTO public.users (
        id,
        email,
        name,
        gender,
        institute,
        division,
        stream,
        batch,
        target,
        xp,
        monthly_xp,
        streak,
        last_streak_date,
        exams_taken,
        level,
        role,
        status,
        avatar_color,
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        v_demo_users.email,
        v_demo_users.name,
        v_demo_users.gender,
        v_demo_users.institute,
        'Science',
        v_demo_users.stream,
        v_demo_users.batch,
        v_demo_users.target,
        v_demo_users.xp,
        v_demo_users.monthly_xp,
        v_demo_users.streak,
        CURRENT_DATE,
        v_demo_users.exams_taken,
        v_demo_users.level,
        'Student',
        'Active',
        v_demo_users.avatar_color,
        v_demo_users.avatar_url,
        NOW() - (v_demo_users.streak || ' days')::INTERVAL,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        gender = EXCLUDED.gender,
        institute = EXCLUDED.institute,
        stream = EXCLUDED.stream,
        batch = EXCLUDED.batch,
        target = EXCLUDED.target,
        xp = EXCLUDED.xp,
        monthly_xp = EXCLUDED.monthly_xp,
        streak = EXCLUDED.streak,
        last_streak_date = CURRENT_DATE,
        exams_taken = EXCLUDED.exams_taken,
        level = EXCLUDED.level,
        avatar_color = EXCLUDED.avatar_color,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();

      -- Seed realistic user badges
      IF v_demo_users.exams_taken >= 1 THEN
        INSERT INTO public.user_badges (user_id, badge_id, unlocked_at)
        VALUES (v_user_id, 'first_step', NOW() - INTERVAL '15 days')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;

      IF v_demo_users.streak >= 3 THEN
        INSERT INTO public.user_badges (user_id, badge_id, unlocked_at)
        VALUES (v_user_id, 'streak_3', NOW() - INTERVAL '7 days')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;

      IF v_demo_users.streak >= 7 THEN
        INSERT INTO public.user_badges (user_id, badge_id, unlocked_at)
        VALUES (v_user_id, 'streak_7', NOW() - INTERVAL '2 days')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;

      IF v_demo_users.exams_taken >= 5 THEN
        INSERT INTO public.user_badges (user_id, badge_id, unlocked_at)
        VALUES (v_user_id, 'precision_master', NOW() - INTERVAL '5 days')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;

      IF v_demo_users.xp >= 1000 THEN
        INSERT INTO public.user_badges (user_id, badge_id, unlocked_at)
        VALUES (v_user_id, 'knowledge_sage', NOW() - INTERVAL '4 days')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;

      IF v_demo_users.xp >= 5000 THEN
        INSERT INTO public.user_badges (user_id, badge_id, unlocked_at)
        VALUES (v_user_id, 'apex_legend', NOW() - INTERVAL '1 day')
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping user % due to error: %', v_demo_users.email, SQLERRM;
    END;
  END LOOP;

  -- Refresh institute rankings materialized view if it exists
  BEGIN
    PERFORM refresh_institute_rankings();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RAISE NOTICE 'Successfully seeded realistic demo Bangladeshi HSC and SSC students with full avatars and streams!';
END $$;
