# 📱 Obhyash Mobile App (Flutter) — Development & Change Tracking

> **App Name:** Obhyash (অভ্যাস)  
> **Platforms:** Android (APK / App Bundle) & iOS (IPA)  
> **Framework:** Flutter 3.x (Dart)  
> **Architecture:** Feature-First (Clean Architecture with Riverpod & Provider)  
> **Directory:** `/obhyash-flutter/obhyash_app/`  
> **Last Updated:** September 23, 2026  

---

## 🏗️ 1. Architecture & Feature Modules

The Obhyash Flutter app follows a **Feature-Driven Architecture**, where each core domain is isolated under `lib/features/` with its own presentation, domain, and data layers:

```
lib/
├── core/                        # Global configurations, networking, deep links, theme
│   ├── services/
│   │   └── deep_link_service.dart # Deep link interceptor (?ref=... & ?code=...)
│   └── theme/                   # Emerald theme tokens & typography (Anek Bangla)
├── features/
│   ├── auth/                    # Login, Signup, OTP, Social Auth, Referral code auto-fill
│   ├── subscription/            # Pricing plans, Coupons, Payment sheets (bKash/Nagad)
│   ├── referral/                # Referral codes, Scratch Card animations, Pro days reward
│   ├── exam/                    # MCQ practice engine, smart timers, immediate explanation
│   ├── live_exam/               # Real-time scheduled exams, national rank calculation
│   ├── question_bank/           # 20+ years HSC board & admission questions
│   ├── gamification/            # XP, Badges, Level Progression
│   ├── legends_league/          # Weekly tier-based competitive leagues
│   ├── leaderboard/             # Daily & Weekly top student ranking
│   ├── analysis/                # Performance analytics, mistake notebook, weak topic tags
│   └── subject_report/          # Chapter-by-chapter mastery metrics
└── main.dart                    # App initialization, Supabase config, deep link wiring
```

---

## 🚀 2. Recent Updates & Changelog

### 🟢 Version Update: Ambassador Coupon & Checkout Harmonization (Sept 23, 2026)
* **Coupon Service Update (`lib/features/subscription/domain/coupon_service.dart`)**:
  - Registered **`AMIR33`** coupon in `_activeCoupons`.
  - Configured exact fixed price points matching Web:
    - **1 Month (149 ৳):** ➔ **99 ৳** (Save 50 ৳)
    - **3 Months (349 ৳):** ➔ **249 ৳** (Save 100 ৳)
    - **Admission (599 ৳):** ➔ **399 ৳** (Save 200 ৳)
  - Deactivated legacy `PIONEER` coupon (`isActive: false`).
* **Coupon Modal UI Cleanup (`lib/features/subscription/presentation/widgets/coupon_bottom_sheet.dart`)**:
  - **Removed Public Coupon Hint:** Deleted the *"চলতি অফার কুপন: PIONEER"* suggestion row below the text field so general users cannot discover or auto-fill codes without having an ambassador.
  - **Clean Placeholder:** Updated input field hint text to `'কুপন কোড লিখো'`.

---

### 🟢 Referral Deep Link & Auto-Fill Tracking
* **Deep Link Service (`lib/core/services/deep_link_service.dart`)**:
  - Listens to incoming links (e.g. `https://obhyash.com/?ref=AMIR33` or `obhyash://app?ref=AMIR33`).
  - Persists `referralCode` in `SharedPreferences`.
* **Registration Screen (`lib/features/auth/presentation/signup_view.dart`)**:
  - Checks `prefs.getString('referralCode')` on screen mount.
  - Automatically pre-fills the referral code field in the signup form.
* **Authentication Controller (`lib/features/auth/providers/auth_controller.dart`)**:
  - Invokes `redeem_referral_by_code` RPC in Supabase upon successful registration.
  - Clears `referralCode` from `SharedPreferences` once claimed.

---

### 🟢 Gamification & Scratch Card Integration
* **Scratch Card Engine (`lib/features/referral/presentation/`)**:
  - Interactive scratch-to-reveal canvas for referral rewards.
  - Supports 50% discount coupon generation (`SC-XXXXXXXX`) and Pro days rewards.
* **Legends League (`lib/features/legends_league/`)**:
  - Weekly promotion/demotion system based on XP earned from practice exams.

---

## 📁 3. Flutter Files Registry

| File Path (relative to `obhyash_app/`) | Status | Responsibility |
| `lib/features/subscription/domain/coupon_service.dart` | **MODIFIED** | Added `AMIR33`, deactivated `PIONEER`, fixed pricing |
| `lib/features/subscription/presentation/widgets/coupon_bottom_sheet.dart` | **MODIFIED** | Removed public coupon suggestion hint, updated text field |
| `lib/core/utils/bangla_name_helper.dart` | **MODIFIED** | Added Bengali literature aliases, chapter variants (`Grammar Part`, `ব্যাকরণ অংশ`, `নির্মিতি`, `ডেটাবেস`) |
| `lib/features/exam/providers/exam_provider.dart` | **MODIFIED** | Removed Tier 3 unconstrained chapter top-up, strictly scoped topic queries |
| `lib/features/exam/services/offline_question_bank_service.dart` | **MODIFIED** | Added topic filtering, null-safe key normalization, prevented out-of-scope fallback |
| `lib/core/services/deep_link_service.dart` | **ACTIVE** | Intercepts referral links from WhatsApp/Facebook/Browser |
| `lib/features/auth/presentation/signup_view.dart` | **ACTIVE** | Registration UI with automatic referral code population |
| `lib/features/auth/providers/auth_controller.dart` | **ACTIVE** | RPC referral redemption and Supabase session management |
| `lib/features/subscription/presentation/my_subscription_view.dart` | **ACTIVE** | Active plan status, renewal CTA, and payment initiator |
| `lib/features/referral/presentation/referral_view.dart` | **ACTIVE** | Student referral hub, copy personal code, share on socials |

---

### 🟢 Topic Normalization & Modern Syllabus Alignment (Sept 23, 2026)
* **Topic Search Engine (`lib/core/utils/bangla_name_helper.dart`)**:
  - Added bidirectional aliases for Bengali literature topics (`মানব-কল্যাণ` <-> `মানব কল্যাণ`, `তাহারেই পড়ে মনে` <-> `তাহাই পড়ে মনে`, `নূরলদীনের কথা মনে পড়ে যায়` <-> `নুরলদীনের কথা মনে পড়ে যায়`, `বায়ান্নর দিনগুলো` <-> `বায়ান্নোর দিনগুলো`, `রেইনকোট` <-> `রেনকোট`).
  - Added automatic hyphen and space expansion.
* **Database Alignment**:
  - Supabase `public.topics` table cleaned of pre-2024 obsolete and corrupted entries. Mobile app exam setup now loads modern canonical topics with correct serials (1-14).

---

### 🟢 Topic Exam Isolation & Whole-Book Leak Prevention (Sept 23, 2026)
* **Exam Provider (`lib/features/exam/providers/exam_provider.dart`)**:
  - **Removed Tier 3 Unconstrained Chapter Top-Up**: When a user selects a topic exam, the system no longer pulls random questions from other topics in the chapter to artificially fulfill the question quota.
  - **All-Topic Keyword Search**: Tier 2 substring matching now evaluates all selected topics without restriction.
  - **Scoped Offline Fallback**: Calls to `OfflineQuestionBankService.getQuestions` now pass `topics: topicsList`.
* **Offline Question Bank Service (`lib/features/exam/services/offline_question_bank_service.dart`)**:
  - Added `topics` parameter to `getQuestions`.
  - Strictly filters cached questions by topic; never leaks questions from other topics or the general subject pool.
  - Made `_normalizeKey(String? s)` completely null-safe.
* **Chapter Synonyms (`lib/core/utils/bangla_name_helper.dart`)**:
  - Added mappings for `Grammar Part`, `ব্যাকরণ অংশ`, `নির্মিতি অংশ`, and `ডেটাবেস ম্যানেজমেন্ট সিস্টেম`.

---

### 🟢 RPC Latency & Adaptive Engine Timeout Optimization (Sept 23, 2026)
* **Exam Provider (`lib/features/exam/providers/exam_provider.dart`)**:
  - **Increased RPC Timeout**: Adjusted `get_adaptive_mock_exam_questions` timeout from 1200ms to 3500ms to allow mobile devices on slower 3G/4G connections to complete server-side question sampling without prematurely aborting into fallback.
* **Academic Section Detail View (`lib/features/question_bank/presentation/academic_section_detail_view.dart`)**:
  - **Lean Column Projection**: Replaced `select('*')` with `select(kLeanQuestionFields)`. Reduces payload size by ~70% and prevents frame drops during question bank navigation.
  - **Quarantine Filter Enforcement**: Added `.eq('status', 'Approved')` to all question queries in `exam_provider.dart` (topic queries, keyword fallbacks, general chapter queries) and `academic_section_detail_view.dart`, guaranteeing defective/OCR rows never appear on mobile devices.
* **KaTeX Formula Rendering (`lib/core/presentation/widgets/formula_math_view.dart`)**:
  - **Dynamic LaTeX Sanitizer (`_sanitizeLatex`)**: Injected auto-sanitization before passing equations to `Math.tex`. Automatically unrolls Greek letters wrapped in `\text{}`, converts superscript/subscripts inside text units, removes nested `$` delimiters, and fixes broken reaction arrows to prevent raw code fallback.

---

## 🛠️ 4. Build & Deployment Commands

```bash
# Clean and get dependencies
flutter clean
flutter pub get

# Code analysis and linting
flutter analyze

# Build Android Release APK
flutter build apk --release

# Build Android App Bundle (Google Play Store)
flutter build appbundle --release

# Build iOS IPA (App Store)
flutter build ipa --release
```
