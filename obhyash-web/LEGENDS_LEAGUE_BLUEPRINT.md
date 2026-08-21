# 🏆 Legends League (লেজেন্ডস লিগ) - Master Blueprint & Architecture Memory

> **Status**: Architecture & V1 Hub Ready · Full Live Tournament Execution Scheduled for **V2 Release**  
> **Last Updated**: August 21, 2026  
> **Concept**: Monthly Knockout Elimination Tournament for Top 30 Legend-level Toppers

---

## 📌 ১. কনসেপ্ট ও ভিশন (Executive Summary)

**লেজেন্ডস লিগ (Legends League)** হলো ‘অভ্যাস’ প্ল্যাটফর্মের সবচেয়ে প্রেস্টিজিয়াস এবং এলিট টুর্নামেন্ট সিস্টেম (Duolingo Diamond Tournament & Chess.com Champions Tour আদলে তৈরি)।

- **কারা অংশগ্রহণ করবে?** প্রতি মাসের শেষে মাসিক লিডারবোর্ডে লিজেন্ড লেভেলে থাকা শীর্ষ ৩০ (Top 30) জন শিক্ষার্থী।
- **কখন ও কিভাবে অনুষ্ঠিত হবে? (১৫ দিনের টুর্নামেন্ট ক্যালেন্ডার)**:
  - 📖 **১লা তারিখ**: কোয়ালিফায়ারদের প্রোফাইলে গোল্ডেন টিকেট আনলক এবং টুর্নামেন্টের স্পেশাল সিলেবাস ঘোষণা।
  - ⏳ **১ম সপ্তাহ (১–৭ তারিখ)**: সিলেবাস অনুযায়ী শিক্ষার্থীদের প্রস্তুতি পর্ব (Preparation Week)।
  - ⚔️ **২য় সপ্তাহ (৮–১৪ তারিখ)**: ৩ ধাপের লাইভ নকআউট মেধা যুদ্ধ (Quarter-Final ➔ Semi-Final ➔ Grand Finale)।
  - 🏆 **১৫ই তারিখ**: গ্র্যান্ড রেজাল্ট ঘোষণা, প্রোফাইলে চ্যাম্পিয়ন ব্যাজ আনলক ও সেলিব্রেশন।
- **পুরস্কার**: নগদ প্রাইজ মানি, এক্সক্লুসিভ ব্র্যান্ডেড ‘অভ্যাস’ টি-শার্ট, প্রোফাইলে ‘Supreme Champion’ গোল্ডেন ব্যাজ এবং লিডারবোর্ডে গোল্ডেন হ্যালো ফ্রেম।

---

## 📅 ২. পূর্ণাঙ্গ ১৫ দিনের টাইমলাইন ও টুর্নামেন্ট ক্যালেন্ডার (Schedule Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      🏆 লেজেন্ডস লিগ সিজন ক্যালেন্ডার                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📅 ১লা তারিখ       │ 🎫 গোল্ডেন টিকেট আনলক ও 📖 সিলেবাস প্রকাশ               │
│ ⏳ ১–৭ তারিখ (১ম সপ্তাহ)│ 📚 প্রস্তুতি পর্ব (শিক্ষার্থীদের রিভিশন ও প্র্যাকটিস)      │
│ ⚔️ ৮–১৪ তারিখ (২য় সপ্তাহ)│ 🔥 ৩ ধাপের নকআউট লিগ:                               │
│                    │   • রাউন্ড ১ (Quarter-Final): টপ ৩০ জন ➔ টপ ১৫ জন   │
│                    │   • রাউন্ড ২ (Semi-Final):    টপ ১৫ জন ➔ টপ ৫ জন    │
│                    │   • রাউন্ড ৩ (Grand Finale):  টপ ৫ জন ➔ চ্যাম্পিয়ন │
│ 🏆 ১৫ই তারিখ       │ 🎉 গ্র্যান্ড রেজাল্ট, প্রাইজ মানি ও কুরিয়ারে টি-শার্ট ডেলিভারি │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ ৩. যা যা ইতিমধ্যে সম্পন্ন করা হয়েছে (What is ALREADY DONE)

### ১) ডাটাবেস আর্কিটেকচার ও স্কিমা
- **ফাইল**: [`sql/migrations/20260821_legends_league_system.sql`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/sql/migrations/20260821_legends_league_system.sql)
  - `public.legends_league_seasons`: সিজন নম্বর, তারিখ (১–১৫ তারিখ), স্ট্যাটাস (`upcoming`, `active`, `completed`) ট্র্যাকিং।
  - `public.legends_league_qualifiers`: কোয়ালিফাই করা শিক্ষার্থীদের স্কোর, টিকেট ক্লেম স্ট্যাটাস এবং বর্তমান স্টেজ (`round_1`, `semi_final`, `grand_finale`, `eliminated`, `champion`)।
  - `public.legends_league_exams`: প্রতিটি রাউন্ডের স্পেশাল টেস্ট কনফিগারেশন।
  - `public.qualify_monthly_legend_toppers()` RPC: মাস শেষে স্বয়ংক্রিয়ভাবে টপ ৩০ লিজেন্ড শিক্ষার্থীকে সিলেক্ট করে টুর্নামেন্টে যুক্ত করার ফাংশন।
  - Row Level Security (RLS) ও পারমিশন গ্রান্টস।

### ২) মাসিক লিডারবোর্ড ট্র্যাকিং ও রিসেট সিস্টেম
- **ফাইল**: [`sql/migrations/20260821_monthly_leaderboard_reset.sql`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/sql/migrations/20260821_monthly_leaderboard_reset.sql)
  - `monthly_xp` এবং `monthly_xp_reset_at` ট্র্যাকিং।
  - ক্যালেন্ডার মাস শেষ হলে স্বয়ংক্রিয় রোলওভার এবং ফ্রেশ স্টার্ট।

### ৩) টুর্নামেন্ট হাব UI (Flutter View)
- **ফাইল**: [`lib/features/legends_league/presentation/legends_league_view.dart`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/features/legends_league/presentation/legends_league_view.dart)
  - **Hero Platinum Card**: প্ল্যাটিনাম স্লেট মেটালিক গ্রেডিয়েন্ট, ৪-ধাপের টাইমলাইন (সিলেবাস ➔ প্রস্তুতি ➔ নকআউট ➔ রেজাল্ট)।
  - **Connected Knockout Bracket**: ২য় সপ্তাহের ৩ ধাপের স্টেপার ফ্লো ডায়াগ্রাম (কোয়ার্টার ফাইনাল ➔ সেমিফাইনাল ➔ গ্র্যান্ড ফিনালে)।
  - **Organized Rules Card**: ৬টি স্পষ্ট ও সুবিন্যস্ত টাইমলাইন, সিলেবাস ও টাইব্রেকার নিয়মাবলী।
  - **Mega Rewards Section**: প্ল্যাটিনাম, ডিপ গ্রিন (টপ ৩), ডিপ রেড (টপ ৪-৫) এবং ডিপ পার্পল (টপ ৩০) প্যালেটে ক্যাশ প্রাইজ ও টি-শার্ট রিওয়ার্ডস।

### ৪) লিডারবোর্ড হেডার অ্যাকশন ও রাউটিং
- **ফাইল**: [`lib/core/presentation/main_layout.dart`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/core/presentation/main_layout.dart)
  - লিডারবোর্ড হেডারের ডানপাশে আকর্ষণীয় **`👑 লেজেন্ডস লিগ`** (গ্লোয়িং লাল রঙ) বাটন।
  - ক্লিন সিঙ্গেল হেডার ও ব্যাক নেভিগেশন।
- **ফাইল**: [`lib/core/router.dart`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/core/router.dart)
  - `/legends-league` ডেডিকেটেড রাউট কনফিগারেশন।

---

## 📋 ৪. টুর্নামেন্ট নিয়মাবলী ও পুরস্কার কাঠামো (Rules & Rewards)

### পুরস্কার কাঠামো:
1. **১ম, ২য় ও ৩য় স্থান (গ্র্যান্ড চ্যাম্পিয়ন - Deep Emerald Green & Platinum)**:
   - 💰 নগদ প্রাইজ মানি (Cash Prize)
   - 👕 এক্সক্লুসিভ অভ্যাস টি-শার্ট
   - 🎖️ প্রোফাইলে সুপ্রিম চ্যাম্পিয়ন গোল্ডেন ব্যাজ
   - ✨ লিডারবোর্ডে গোল্ডেন হ্যালো ফ্রেম
2. **৪র্থ ও ৫ম স্থান (টপ ৫ ফাইনালিস্ট - Deep Crimson Red & Platinum Slate)**:
   - 👕 এক্সক্লুসিভ অভ্যাস টি-শার্ট
   - 🎖️ টপ ৫ ফাইনালিস্ট প্রোফাইল ব্যাজ
   - 📜 ডিজিটাল মেরিট সার্টিফিকেট
3. **সকল ৩০ জন কোয়ালিফায়ার (Participation - Deep Purple & Dark Platinum)**:
   - 🎫 অফিসিয়াল পার্টিসিপেশন সার্টিফিকেট ও সিজন ১ এক্সক্লুসিভ ব্যাজ।

---

## 🚀 ৫. V2 রিলিজের জন্য যা যা করতে হবে (V2 Implementation Roadmap)

যখন আমরা V2 রিলিজে এই ফিচারটি সম্পূর্ণ লাইভ করব, তখন নিচের ধাপগুলো সম্পন্ন করতে হবে:

### ধাপ ১: স্বয়ংক্রিয় কোয়ালিফিকেশন ক্রন (Automated Cron Job)
- Supabase `pg_cron` বা এজ ফাংশন সেটআপ:
  - প্রতি মাসের শেষ দিন রাত ১১:৫৯ মিনিটে `SELECT public.qualify_monthly_legend_toppers(NULL, NULL, 30);` এক্সিকিউট হবে।

### ধাপ ২: ১লা তারিখ গোল্ডেন টিকেট ও সিলেবাস পপ-আপ (Golden Ticket & Syllabus Modal)
- কোয়ালিফাইড শিক্ষার্থী মাসের ১ তারিখ অ্যাপে লগইন করলে একটি বিলাসবহুল গোল্ডেন টিকেট আনলক ও টুর্নামেন্ট সিলেবাস কার্ড পপ-আপ হবে:
  - *"অভিনন্দন! তুমি লেজেন্ডস লিগে কোয়ালিফাই করেছ! আগামী ১ সপ্তাহ প্রস্তুতি নাও, ৮ই তারিখ থেকে নকআউট শুরু।"*

### ধাপ ৩: স্পেশাল টুর্নামেন্ট এক্সাম ইঞ্জিন (Exclusive Exam Runner)
- শুধুমাত্র কোয়ালিফাইড এবং নন-এলিমিনেটেড শিক্ষার্থীরাই পরীক্ষার সময়ে এক্সামে ঢুকতে পারবে।
- সাধারণ শিক্ষার্থীরা লক আইকনসহ লাইভ কাউন্টডাউন দেখবে।
- টাইব্রেকার লজিক: নম্বর সমান হলে সাবমিশন টাইম (মিলিসেকেন্ড অ্যাকুরেসি) অনুযায়ী অটো-র‍্যাংকিং।

### ধাপ ৪: লাইভ ব্র্যাকেট ও স্পেক্টেটর মোড (Live Standings & Spectator Hub)
- অন্য শিক্ষার্থীরা টুর্নামেন্ট হাবে ঢুকে লাইভ দেখতে পারবে কারা সেমিফাইনালে উঠল এবং কে চ্যাম্পিয়ন হলো।

### ধাপ ৫: ১৫ই তারিখ রেজাল্ট ও হল অব ফেম (Hall of Fame Archive)
- টুর্নামেন্ট শেষে পূর্ববর্তী সিজনের চ্যাম্পিয়নদের নাম ও ছবি দিয়ে 'হল অব ফেম' পেজ অটো-আপডেট হবে।

---

## 🗂️ ৬. ফাইল ম্যাপ (Codebase File Map)

| ফিচার এরিয়া | ফাইল পাথ |
|---|---|
| **SQL Schema** | [`sql/migrations/20260821_legends_league_system.sql`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/sql/migrations/20260821_legends_league_system.sql) |
| **Monthly Reset SQL** | [`sql/migrations/20260821_monthly_leaderboard_reset.sql`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/sql/migrations/20260821_monthly_leaderboard_reset.sql) |
| **Frontend View** | [`lib/features/legends_league/presentation/legends_league_view.dart`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/features/legends_league/presentation/legends_league_view.dart) |
| **Header Action** | [`lib/core/presentation/main_layout.dart`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/core/presentation/main_layout.dart) |
| **App Routing** | [`lib/core/router.dart`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/lib/core/router.dart) |
| **Blueprint Doc** | [`LEGENDS_LEAGUE_BLUEPRINT.md`](file:///Users/limon/Documents/Obhyash-complete-project/obhyash-web/LEGENDS_LEAGUE_BLUEPRINT.md) |

---
*এই ডকুমেন্টটি ভবিষ্যতের V2 ডেভেলপমেন্টের জন্য সম্পূর্ণ গাইড ও মেমোরি হিসেবে সংরক্ষিত রইল।*
