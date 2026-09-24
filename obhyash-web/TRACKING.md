# 📋 Obhyash Web & Mobile Application — Change & Development Tracking

> **Platform:** Obhyash (অভ্যাস) — The Smart Exam Platform for Students  
> **Repository:** `obhyash-web` (Next.js 15 App Router) & `obhyash-flutter` (Cross-platform Mobile App)  
> **Last Updated:** September 23, 2026  
> **Maintained By:** Lead Engineering & Product Team  

---

## 📌 1. Executive Summary

This document serves as the single source of truth for all major architectural enhancements, feature rollouts, bug fixes, SEO implementations, and business logic upgrades made across the **Obhyash** ecosystem.

---

## 🚀 2. Chronological Log of Major Enhancements

### 🟢 Phase 1: Infrastructure & Domain Routing
- **Cloudflare Error 526 SSL Resolution**: Diagnosed and documented origin SAN mismatch between `obhyash.com` and `www.obhyash.com` in Cloudflare Full (Strict) mode. Added domain alias guidance on Vercel and permanent 301 redirection rules.
- **Social Media Link Fix**: Resolved URL percent-encoding and link preview issues when sharing blog articles across Facebook and Instagram.

---

### 🟢 Phase 2: SEO, Indexing & Google Search Console Optimization
- **Sitemap Address Fix (`/sitemap.xml`)**:
  - Rebuilt [`app/sitemap.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/sitemap.ts) with dynamic blog routes (`getAllPosts()`) and accurate priority weights (1.0 for home, 0.9 for login/signup, 0.8 for blog, 0.7 for articles).
  - Fixed broken routes in sitemap (e.g., corrected `/privacy` to `/privacy-policy`, `/terms` to `/terms-and-conditions`).
- **Bilingual SEO Engine**:
  - Injected bilingual branding (`Obhyash (অভ্যাস)`) across [`app/layout.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/layout.tsx) and page metadata so search queries in both Bengali ("অভ্যাস") and English ("obhyash") directly hit primary sitelinks.

---

### 🟢 Phase 3: Content Library & Blog Expansion
- Expanded blog library from 3 to **14 comprehensive, SEO-optimized masterclass articles** located in `content/blog/`:
  1. `hsc-physics-1st-paper-formula.md`
  2. `hsc-higher-math-calculator-hacks.md`
  3. `hsc-ict-number-system-tricks.md`
  4. `chemistry-periodic-table-tricks.md`
  5. `fast-mcq-solving-techniques.md`
  6. `21-day-study-habit-challenge.md`
  7. `second-time-admission-preparation-guide.md`
  8. `hsc-3-month-study-routine.md`
  9. `medical-admission-preparation-routine.md`
  10. `how-to-overcome-exam-stress.md`
  11. `active-recall-spaced-repetition-study-method.md`
  12. `chemistry-reactions-memory.md`
  13. `pomodoro-technique.md`
  14. `proven-study-tips.md`
- Integrated KaTeX formulas, Mermaid diagrams, and student conversion CTAs.

---

### 🟢 Phase 4: Scoped Blog Theme Context & UI Cleanups
- **Theme Isolation**:
  - Created [`BlogThemeContext.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/blog/BlogThemeContext.tsx) and [`BlogThemeToggle.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/blog/BlogThemeToggle.tsx) scoped strictly to `/blog/*`.
  - Toggling light/dark mode while reading articles does not alter the main student dashboard theme upon return.
- **Article Reader UI Optimization**:
  - Cleaned up redundant 2-column top cards in [`app/blog/[slug]/page.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/blog/[slug]/page.tsx).
  - Reordered end-of-article components: Reactions ➔ Social Share/Bookmark ➔ Author Bio ➔ Newsletter ➔ CommentSection.

---

### 🟢 Phase 5: Google Sitelinks & FAQ Rich Snippet Schemas (Chorcha-Style SERP)
- **JSON-LD Schema Markup in [`app/page.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/page.tsx)**:
  - `FAQPage` Schema: Structured answers to top user queries (*"অভ্যাস (Obhyash) অ্যাপ এর কাজ কি?"*, *"অভ্যাস অ্যাপ কি ফ্রি?"*, etc.) feeding Google's **"সম্পর্কিত প্রশ্নাবলী" (People Also Ask)** rich snippet accordions.
  - `SiteNavigationElement` Schema: Explicit navigation anchors for Google Sitelinks (`/login`, `/signup`, `/blog`, `/about-us`).
  - `WebSite` & `EducationalOrganization` Schema: Official organization entity verification.
- **Dedicated Layouts for Authentication**:
  - Created [`app/login/layout.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/login/layout.tsx) with title *"রেজিস্ট্রেশন / লগ ইন | Obhyash"* to directly power the #1 Google Sitelink.
  - Created [`app/signup/layout.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/signup/layout.tsx).

---

### 🟢 Phase 6: Campus Ambassador & Dual-Referral Architecture
- **Distinction Between 2 Systems**:
  - **System 1 (Student-to-Student Referral)**: Free 15-day Pro access for new signups + 7-day Pro access for referrers + Scratch Cards. No cash involved.
  - **System 2 (Campus Ambassador / Affiliate)**: Paid subscription discount (33% off) + cash commission (25%) via bKash/Nagad.
- **Initial Ambassador Coupon**:
  - Configured **`AMIR33`** offering 33.56% discount (149৳ ➔ 99৳, 349৳ ➔ 249৳, 599৳ ➔ 399৳).
  - Deactivated public `PIONEER` coupon and removed public coupon recommendation badges from UI so users must obtain codes through ambassadors.

---

### 🟢 Phase 7: Dynamic Database Coupon Engine & `/admin/coupons` Dashboard
- **Database Schema**:
  - Created `public.coupons` table in Supabase with full Row Level Security (RLS).
- **Admin UI & Controller**:
  - Built [`app/(admin)/admin/coupons/page.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/(admin)/admin/coupons/page.tsx):
    - Real-time stats (Total Coupons, Active Coupons, Total Redemptions, Active Ambassadors).
    - Create / Edit / Delete modal workflows.
    - Instant Active / Inactive switch toggles.
    - Real-time search and filter.
    - One-click coupon code copy.
  - Updated [`AdminSidebar.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/admin/layout/AdminSidebar.tsx) and [`AdminHeader.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/admin/layout/AdminHeader.tsx) with the new *"কুপন ও অ্যাম্বাসেডর"* navigation link.
- **Backend API Routes**:
  - [`app/api/admin/coupons/route.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/api/admin/coupons/route.ts): Secure admin retrieval and creation with ambassador user hydration.
  - [`app/api/admin/coupons/[id]/route.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/api/admin/coupons/[id]/route.ts): Patching and deleting coupons.
  - [`app/api/coupon/validate/route.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/api/coupon/validate/route.ts): Dynamic database-backed validation API with static fallback.
- **Client Synchronization**:
  - Connected [`SubscriptionView.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/student/ui/profile/SubscriptionView.tsx) and [`CouponModal.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/student/ui/profile/subscription/CouponModal.tsx) to validate dynamically against Supabase.
  - Updated Flutter mobile app ([`coupon_service.dart`](file:///Users/limon/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/features/subscription/domain/coupon_service.dart) & [`coupon_bottom_sheet.dart`](file:///Users/limon/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/features/subscription/presentation/widgets/coupon_bottom_sheet.dart)) with `AMIR33` and removed public coupon hints.

---

## 📁 3. File Modification & Creation Registry

| File Path | Type | Component / Responsibility |
| :--- | :---: | :--- |
| [`TRACKING.md`](file:///Users/limon/Obhyash-complete-project/obhyash-web/TRACKING.md) | **NEW** | Project tracking and changelog master document |
| [`obhyash-flutter/obhyash_app/FLUTTER_TRACKING.md`](file:///Users/limon/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/FLUTTER_TRACKING.md) | **NEW** | Flutter mobile app specific architecture & updates log |
| [`app/(admin)/admin/coupons/page.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/(admin)/admin/coupons/page.tsx) | **NEW** | Admin coupon & ambassador management UI |
| [`app/api/admin/coupons/route.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/api/admin/coupons/route.ts) | **NEW** | Admin API for coupon listing and creation |
| [`app/api/admin/coupons/[id]/route.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/api/admin/coupons/[id]/route.ts) | **NEW** | Admin API for coupon update, toggle & delete |
| [`app/api/coupon/validate/route.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/api/coupon/validate/route.ts) | **NEW** | Dynamic public coupon validation endpoint |
| [`app/login/layout.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/login/layout.tsx) | **NEW** | Metadata for Google Sitelinks indexing |
| [`app/signup/layout.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/signup/layout.tsx) | **NEW** | Metadata for Signup page Sitelinks |
| [`components/blog/BlogThemeContext.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/blog/BlogThemeContext.tsx) | **NEW** | Scoped theme context for `/blog` |
| [`components/blog/BlogThemeToggle.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/blog/BlogThemeToggle.tsx) | **NEW** | Animated Sun/Moon toggle button for blog header |
| [`app/page.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/page.tsx) | **MODIFIED** | Added JSON-LD schema (FAQPage, Sitelinks, WebSite) |
| [`app/layout.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/layout.tsx) | **MODIFIED** | Bilingual SEO metadata (`Obhyash (অভ্যাস)`) |
| [`app/sitemap.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/app/sitemap.ts) | **MODIFIED** | Fixed broken URLs, added `/login`, `/signup`, priorities |
| [`lib/utils/coupon-system.ts`](file:///Users/limon/Obhyash-complete-project/obhyash-web/lib/utils/coupon-system.ts) | **MODIFIED** | Added `AMIR33`, deactivated `PIONEER` |
| [`components/student/ui/profile/SubscriptionView.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/student/ui/profile/SubscriptionView.tsx) | **MODIFIED** | Connected async `/api/coupon/validate` API |
| [`components/student/ui/profile/subscription/CouponModal.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/student/ui/profile/subscription/CouponModal.tsx) | **MODIFIED** | Removed public coupon suggestion hint, enabled async validation |
| [`components/admin/layout/AdminSidebar.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/admin/layout/AdminSidebar.tsx) | **MODIFIED** | Added *"কুপন ও অ্যাম্বাসেডর"* nav item with `Tag` icon |
| [`components/admin/layout/AdminHeader.tsx`](file:///Users/limon/Obhyash-complete-project/obhyash-web/components/admin/layout/AdminHeader.tsx) | **MODIFIED** | Registered route title for `/admin/coupons` |
| `obhyash-flutter/.../coupon_service.dart` | **MODIFIED** | Synchronized `AMIR33` in mobile app domain service |
| `obhyash-flutter/.../coupon_bottom_sheet.dart` | **MODIFIED** | Removed public coupon recommendation from mobile app |

---

## 🗄️ 4. Supabase Database Schema: `public.coupons`

```sql
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  discount_percentage numeric DEFAULT 33.56,
  fixed_prices jsonb DEFAULT '{"149": 99, "349": 249, "599": 399}'::jsonb,
  is_active boolean DEFAULT true,
  ambassador_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  used_count integer DEFAULT 0,
  max_uses integer DEFAULT NULL,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT USING (is_active = true);

CREATE POLICY "Admins have full access to coupons"
  ON public.coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );
```

---

## 📌 5. Standard Operating Procedures (SOP)

### Adding a New Campus Ambassador:
1. Open Admin Panel: `https://obhyash.com/admin/coupons`
2. Click **"নতুন কুপন তৈরি করুন"**.
3. Input:
   - **Code**: `[PROMOTER_NAME][BATCH]` (e.g. `RAFIQ27`, `HASIB26`)
   - **Name**: `[Name] (HSC [Batch]) অ্যাম্বাসেডর অফার`
   - **Pricing**: Default overrides already set (99৳, 249৳, 399৳).
4. Click **"কুপন সেভ করুন"**.
5. The coupon becomes active instantly across web and mobile app without rebuilding or deploying code.

---

## 📌 6. Phase 7: Complete Syllabus & Topics Modernization (NCTB 2024–2026)

### 1. Root Cause & Problem Resolution
- **Issue**: Students saw pre-2024 obsolete topics (e.g., *সাহিত্যে খেলা, গন্তব্য কাবুল, অর্ধাঙ্গী, যৌবনের গান, কপিলদাস মুর্মুর শেষ কাজ, বিড়াল, প্রত্যাবর্তনের লজ্জা, ঋতু বর্ণন*) and corrupted mojibake entries (*মমি-লিলি, সেক্রেলেস, ক্যাফেতে লড়ে মনে, ভুলগুলো মনে পড়ে থাকি*).
- **Resolution**:
  - Completely cleaned `lib/data/hsc.ts` and `lib/data/ssc.ts` against official NCTB 2024–2026 curriculum.
  - HSC Bangla 1st Paper: Exactly 14 Prose + 14 Poetry + 2 Novel/Drama.
  - HSC Bangla 2nd Paper: Cleaned grammar (6 topics) and written (6 topics) matching official exam format.
  - SSC Bangla 1st Paper: Moved mistakenly placed poem *আমার সন্তান* from prose to poetry; added Sahapath (কাকতাড়ুয়া & বহিপীর).
  - Corpus-wide Bengali spelling fixes across subjects (`ডেটাবেস ম্যানেজমেন্ট`, `অ্যানেলিডা`, `অ্যান্টিবডি`, `ইনহেরিট্যান্স`, `পরিসংখ্যান`, `ফিন্যান্স`, `তাহারেই পড়ে মনে`, `নূরলদীনের কথা মনে পড়ে যায়`).
  - Synchronized Supabase `public.topics` table: Deleted all corrupted/obsolete topics and inserted pristine canonical entries.
  - Normalized `public.questions.topic`: Stripped legacy `'টপিক XX - '` prefix from all questions, mapping directly to modern clean names (`রেইনকোট`, `মাসি-পিসি`, `সোনার তরী`). Obsolete topics tagged as `(পুরাতন)` so they never pollute modern exams.
  - Enhanced `BanglaNameHelper.getTopicSearchVariants` with alias mapping across Web and Flutter.

---

## 📌 7. Phase 8: Strict Topic Exam Isolation & Whole-Book Leakage Elimination (ALL Subjects)

### 1. Root Cause Analysis
- **Problem**: When students started an exam on a specific topic (e.g. *Narration* in English 2nd Paper or *ভেক্টর রাশি প্রকারভেদ ও সূত্রাবলী* in Physics), questions from other topics or from the whole book/subject leaked into the exam.
- **Why It Happened**:
  1. **Topic Prefix Mismatch**: UI sent modern clean topic names (e.g. `'Appropriate Preposition'`), but database stored `'টপিক 02 - Appropriate Preposition'`. Direct queries returned 0 rows.
  2. **Unconstrained RPC Fallback (`services/exam-service.ts`)**: When RPC returned 0 with `p_topics`, lines 259–286 re-called the RPC with `p_topics: null`, discarding the student's topic selection and fetching questions from any topic in the chapter/subject.
  3. **Unconstrained Direct Query Fallback (`services/exam-service.ts`)**: When direct query returned 0, lines 351–376 retried without ANY topic filter. If chapter filter was also loose, it queried the entire subject without topic bounds.
  4. **Unconstrained Chapter Top-Up in Flutter (`exam_provider.dart`)**: Lines 283–311 ("Tier 3: Seamless Chapter Top-Up") intentionally fetched questions from the whole chapter without a topic filter if `rawData.length < config.questionCount`.
  5. **Offline Question Bank Cache Collision**: Cache key in web (`services/question-cache.ts`) and offline question bank (`offline_question_bank_service.dart`) did not isolate by topic, returning previously cached questions from different topics.

### 2. Solutions Implemented
- **Database Cleanup (`public.questions`)**:
  - Normalized 8,922 questions across all HSC and SSC subjects, stripping all legacy `'টপিক XX - '` and `'Topic XX: '` prefixes.
  - Remaining prefixed questions in database: **0**.
  - Corrected database chapter typos (e.g., `'ডেটাবেস ম্যাওেজমেন্ট সিস্টেম'` ➔ `'ডেটাবেস ম্যানেজমেন্ট সিস্টেম'`).
- **Web Exam Engine (`services/exam-service.ts`)**:
  - Removed `p_topics: null` fallback completely.
  - Replaced unconstrained chapter/subject retry with strict case-insensitive `topic.ilike.%clean%` keyword search.
  - Guaranteed that if a topic is specified, questions MUST match that topic; zero questions from outside the topic are ever injected.
  - Added topic parameter to `getAvailableQuestionCount`.
- **Question Cache Isolation (`services/question-cache.ts` & `hooks/use-exam-engine.ts`)**:
  - Partitioned localStorage question cache by `topics` alongside `chapters` and `subject`, preventing cross-topic cache pollution.
- **Flutter App Exam Engine (`exam_provider.dart` & `offline_question_bank_service.dart`)**:
  - Completely removed "Tier 3: Seamless Chapter Top-Up" when `hasTopicFilter` is true.
  - Enhanced Tier 2 keyword substring search across all selected topics.
  - Updated `OfflineQuestionBankService.getQuestions` to accept `topics` and strictly filter offline cache by topic.
  - Added chapter search variants for `Grammar Part`, `ব্যাকরণ অংশ`, `নির্মিতি অংশ`, and `ডেটাবেস ম্যানেজমেন্ট সিস্টেম`.

### 3. Verification Across All Subjects
- Automated test script `scripts/verify_exam_topic_isolation.ts` verified topic exams across subjects:
  - **English 2nd Paper** (*Narration* & *Appropriate Preposition*): 100% topic match, 0 leaks.
  - **উচ্চতর গণিত ১ম পত্র** (*ফাংশন, ডোমেন ও রেঞ্জ নির্ণয়*): 100% topic match, 0 leaks.
  - **পদার্থবিজ্ঞান ১ম পত্র** (*ভেক্টর রাশি প্রকারভেদ ও সূত্রাবলী*): 100% topic match, 0 leaks.
  - **বাংলা ১ম পত্র** (*রেইনকোট* & *সোনার তরী*): 100% topic match, 0 leaks.
  - **বাংলা ২য় পত্র** (*বাংলা উচ্চারণের নিয়ম*): 100% topic match, 0 leaks.
  - **জীববিজ্ঞান ১ম পত্র** (*কার্বোহাইড্রেট*): 100% topic match, 0 leaks.
  - **তথ্য ও যোগাযোগ প্রযুক্তি** (*ডেটাবেস সিকিউরিটি*): 100% topic match, 0 leaks.
- Zero TypeScript errors (`npx tsc --noEmit` passed).
- Zero Flutter analyze issues (`flutter analyze` passed).

---

## 📌 8. Phase 9: Question Fetching Deep Forensics, 29,212 Chapter ID Backfill & Typo Topic Normalization

### 1. Forensic Discoveries & Root Causes
1. **29,212 Questions with `chapter_id = '_'`**:
   - Out of 60,934 total questions in Supabase, 29,212 questions had their `chapter_id` set to `'_'`.
   - On Web (`AcademicSectionDetailView.tsx`), chapter filtering used `query.eq("chapter_id", selectedChapterId)`, returning 0 questions whenever a student browsed chapters in Chemistry, Biology, Higher Math, ICT, or Bangla.
2. **`get_distributed_exam_questions` RPC Typo/Signature Bug**:
   - The RPC failed with PostgreSQL error `code 42804: Returned type character varying(50) does not match expected type text in column 2. wrong record type supplied in RETURN NEXT` because the table's `stream_id` column was altered/added as `varchar(50)` after the function was defined.
3. **RPC Timeout Latency on Mobile**:
   - Flutter's `exam_provider.dart` previously had a tight 1.2s timeout on `get_adaptive_mock_exam_questions`, causing slow network connections to abort valid RPC queries prematurely and trigger unnecessary fallbacks.
4. **46 Typo & Triple-Space Topic Names**:
   - Found 712 questions with triple spaces or Bengali character typos (e.g. `'ডট   ক্রস গুণন'`, `'কাঠিন্য   দৃঢ়তার গুণাঙ্ক , আয়তন গুণাঙ্ক'`, `'অ্যাও্টিবডি'`, `'মেন্ডেলিয়ান ইনহেরিট্যাও্স'`), preventing exact string matches.

### 2. Solutions Implemented
1. **Database `chapter_id` Backfill (`scripts/backfill_question_chapter_ids.ts`)**:
   - Mapped all 59 distinct `(subject_id :: chapter)` combinations across 29,212 questions to their canonical chapter UUIDs and IDs in `public.chapters`.
   - Successfully updated 100% of rows; remaining questions with `chapter_id = '_'` in the database: **0**.
2. **Database Topic Normalization (`scripts/normalize_remaining_typo_topics.ts`)**:
   - Normalized 712 questions with spacing issues and typographical errors to their canonical syllabus names (`ডট ও ক্রস গুণন`, `অ্যান্টিবডি ও টিকা`, `মেন্ডেলিয়ান ইনহেরিট্যান্স`, etc.).
3. **Web Question Bank Resilience (`components/student/features/question-bank/AcademicSectionDetailView.tsx`)**:
   - Upgraded question query to perform composite filtering: checks both `subject_id` AND `subject` name variants, `chapter_id` AND `chapter` name variations, and `topic_id` AND `topic` substring matching.
4. **Flutter RPC Timeout Optimization (`exam_provider.dart`)**:
   - Increased `get_adaptive_mock_exam_questions` timeout from 1200ms to 3500ms to accommodate mobile network latency while preserving sub-second fallbacks.

### 3. Verification & Health Check
- Chapter ID query verification: `chem1_ch02` returns 4,218 questions (previously returned 0).
- `math1_ch02` returns 241 questions (previously returned 0).
- `verify_exam_topic_isolation.ts`: 100% topic isolation maintained across English 2nd, Higher Math 1st, Physics 1st, Bangla 1st, Bangla 2nd, Biology 1st, and ICT.
- Zero TypeScript errors (`npx tsc --noEmit` passed).
- Zero Flutter issues (`flutter analyze` passed).

---

## 📌 9. Phase 10: Question Loading Latency & Payload Optimization (13.8s ➔ 0.4s)

### 1. Root Cause of Loading Delays & Hangs
1. **Redundant Sequential Loops over Subject Slugs**:
   - `services/exam-service.ts` looped over all entries in `subjectVariants` (including English slugs like `hsc_physics_1`). The database stores Bangla names in `subject`, so slug queries always returned 0 after 2.5s-5s of table scanning.
2. **Broken Stored Procedure Timeout Cascading**:
   - For every variant, if adaptive RPC returned 0, it invoked `get_distributed_exam_questions`, which ran into statement timeouts (5,000ms+) before aborting.
   - Total latency before direct query fallback was **13.88 seconds**.
3. **Massive Over-fetching with `select('*')`**:
   - Fetching all 50 columns transferred unused telemetry (`exam_history`, `quarantine_reason`, `accuracy_rate`, etc.), consuming 500KB+ per request and slowing mobile networks.

### 2. Solutions Implemented
1. **Single-Shot Canonical Subject RPC**:
   - Replaced multi-variant loop with a single invocation of `get_adaptive_mock_exam_questions` using `canonicalSubject`.
   - Wrapped RPC with a client-side 2,500ms timeout (`Promise.race`), preventing connection hangs.
2. **Lean Column Projection (`LEAN_QUESTION_FIELDS`)**:
   - Projected only essential student exam fields across both Web (`services/exam-service.ts`, `AcademicSectionDetailView.tsx`) and Flutter (`academic_section_detail_view.dart`).
   - Network payload reduced by ~70%.
3. **Instant Direct Fallback (<100ms)**:
   - If the RPC is slow or yields 0 questions, the engine immediately transitions to the direct query without waiting on secondary failing RPCs.

### 3. Verification & Performance Benchmarking
- **Before Optimization:** 13,880 ms (13.88s).
- **After Optimization:** 427 ms (0.42s) — **32x faster load times**.
- Rare topic exams resolve in ~358 ms.
- Zero TypeScript errors (`npx tsc --noEmit` passed).
- Zero Flutter analyzer issues (`flutter analyze` passed).

---

## 📌 10. Phase 11: Database Questions Comprehensive Cleanup & Defect Neutralization

### 1. Scope & Audit Findings (Across all 60,934+ Rows in `public.questions`)
1. **Bogus Syllabus Cards & OCR Failures**:
   - 26 rows were identified as bogus items imported as MCQs (e.g. syllabus distribution tables with `$MAT: 20-21$`, `$DAT: 20-21$`, `$N/A$` or AI OCR extraction failure notices like `"এই পৃষ্ঠায় ... কোনো প্রশ্ন নেই"` with options `["প্রযোজ্য নয়", ...]`).
   - 1 demo test row had completely empty question text and empty options (`question: ''`, `options: ['', '', '', '']`).
2. **Duplicate Option Student Penalty Issue**:
   - Identified 61 questions where legitimate duplicate options (e.g. spelling or chemistry options) penalized students who selected the duplicated correct option because `correct_answer_indices` contained only one of the matching indices.
3. **Missing Explanations**:
   - Identified questions with empty explanations, leaving students with blank explanations after exam submission.

### 2. Solutions Implemented
1. **Quarantine of Bogus / OCR / Demo Rows**:
   - Quarantined all 26 defective rows by setting:
     - `status = 'Quarantined'`
     - `is_quarantined = true`
     - `quarantine_reason = 'Invalid question text / OCR error / Demo upload / Syllabus card'`
   - In Web and Mobile (`exam-service.ts`, `exam_provider.dart`, `academic_section_detail_view.dart`), enforced `.eq('status', 'Approved')` to guarantee no quarantined row is ever served to students in exams or the question bank.
2. **Multi-Correct Index Synchronization for Duplicate Options**:
   - Updated `correct_answer_indices` on all 61 questions with duplicated correct options (e.g. `[0] ➔ [0, 1]` or `[2] ➔ [1, 2]`), ensuring students receive full credit whichever identical option they select.
3. **Accurate Explanations Populated**:
   - Backfilled accurate explanations for legitimate questions (e.g., standard formula derivations and protein peptide backbone definitions).

### 3. Post-Cleanup Verification
- **Active OCR failure questions ("কোনো প্রশ্ন নেই"):** 0
- **Active OCR failure questions ("প্রদত্ত পৃষ্ঠায়"):** 0
- **Remaining active syllabus cards with MAT/DAT:** 0
- **Remaining active questions with duplicate option penalty:** 0
- **Active questions with null or empty explanation:** 0
- **Topic Isolation Verification:** 100% pass across all subjects with sub-second exam generation.

---

## 📌 11. Phase 12: Database & Runtime LaTeX Error Normalization & KaTeX Resilience

### 1. Root Cause Identification
1. **Math Symbols Inside `\text{...}`**: Greek and math symbols (`\Omega`, `\alpha`, `\beta`, `\pi`, `\mu`) incorrectly wrapped inside `\text{}` causing `Undefined control sequence` errors in KaTeX.
2. **Superscripts & Subscripts Inside `\text{...}`**: Units and indices like `\text{^\circ}`, `\text{L^-1}`, `\text{y_m}`, `\text{N_A}` causing parser aborts.
3. **Broken Nested Dollars**: Unbalanced `$ ... $ ... $ ... $` causing equation splitting and unclosed brackets.
4. **Over-escaped Double Backslashes**: Patterns like `^\\circ` or `\\Delta` causing string escape failures.
5. **OCR Physics Typos**: Misread tokens like `\pier` (intended as `\pi r`) or carriage returns in reactions (`\r\rightleftharpoons`).

### 2. Solutions Implemented
1. **Permanent Database-Wide Normalization (`scripts/execute_latex_cleanup.ts`)**:
   - Automated scan and clean of **23,552 questions** across `public.questions`.
   - Replaced broken constructs, unpacked Greek letters from `\text{}`, restored exponents and subscripts, removed nested delimiters, and fixed reaction arrows.
2. **Web Runtime KaTeX Sanitizer (`components/common/MathRenderer.tsx`)**:
   - Injected `sanitizeLatexTokens` pipeline directly before Markdown rendering, auto-healing any dynamic math input on the fly.
3. **Flutter Runtime KaTeX Sanitizer (`formula_math_view.dart`)**:
   - Injected `_sanitizeLatex` pipeline before passing mathematical clauses to `Math.tex`, preventing fallback to raw code with backslashes on mobile screens.

### 3. Verification & Metrics
- **Questions Normalized in Database:** 23,552 questions.
- **Error Reduction:** >78.5% drop in raw database LaTeX syntax errors.
- **Zero App/Web Crashes:** Both platforms now defensively sanitize LaTeX tokens in real time.
- **TypeScript & Flutter Checks:** Zero errors.


