# Obhyash V1 Launch Plan

### "ছাত্ররা আগে জানুক, পরে কিনুক" — Students First, Monetize Later

> **Core Philosophy for V1**: No hard paywalls at launch. Give students the full experience for free during a defined "Launch Window", build habit and trust, then gently introduce paid tiers. A student who practices daily for 2 weeks is 10× more likely to pay than a newcomer who hits a paywall on day one.

---

## 🗂️ What's Already Built (Current Status)

### ✅ Core Platform — Done

| Feature                        | Status  | Notes                                       |
| ------------------------------ | ------- | ------------------------------------------- |
| Exam engine (MCQ practice)     | ✅ Done | Digital + OMR modes                         |
| Result view + share card       | ✅ Done | Download/share to social                    |
| Exam history                   | ✅ Done |                                             |
| Subject-wise analytics         | ✅ Done | Chart + subject breakdown + insight cards   |
| Leaderboard                    | ✅ Done | Level-based                                 |
| Streaks & XP                   | ✅ Done |                                             |
| Notifications system           | ✅ Done |                                             |
| Referral program               | ✅ Done | Custom code + share link                    |
| Blog                           | ✅ Done | SEO-optimized, personalized recommendations |
| Report submission (with image) | ✅ Done | R2 storage, proxy image serving             |
| Profile page                   | ✅ Done |                                             |
| Subscription view              | ✅ Done | Manual bKash/Nagad payment approval         |
| Admin dashboard                | ✅ Done | OMR check, user management, subscriptions   |
| Teacher panel                  | ✅ Done | Question upload, exam management            |
| Dark mode                      | ✅ Done |                                             |
| Flutter app (Android/iOS)      | ✅ Done | Mirrors web features                        |
| FAQ page                       | ✅ Done |                                             |
| Landing page                   | ✅ Done |                                             |

### 🔄 Partially Built / Needs Polish

| Feature                 | Status     | What's Missing                                            |
| ----------------------- | ---------- | --------------------------------------------------------- |
| Subscription plans      | 🔄 Partial | Wrong pricing model, no annual plan, no automated payment |
| Onboarding              | 🔄 Partial | No exam target selection (HSC/MBBS/BUET)                  |
| OMR scan (student-side) | 🔄 Partial | Needs UX polish                                           |

### ❌ Not Built Yet

| Feature                                     | Priority | Effort |
| ------------------------------------------- | -------- | ------ |
| Exam target / goal setting                  | High     | Low    |
| Daily question reminder (push notification) | High     | Medium |
| Exam countdown widget                       | High     | Low    |
| Today's goal / daily challenge              | High     | Medium |
| Wrong answer review mode                    | High     | Medium |
| Chapter progress map                        | High     | Medium |
| bKash automated payment API                 | High     | High   |
| Bookmark + flashcard review                 | Medium   | Medium |
| Friend challenge / duel                     | Medium   | High   |
| Topic-level weak detection                  | Medium   | Medium |

---

## 🎯 V1 Strategy: "Free First, Trust First"

### The Problem with Hard Paywalls at Launch

Most competitors gate features immediately. Students hit a wall, feel frustrated, leave, and never return. At launch you have **zero brand equity** — students have no reason to pay for something they haven't experienced.

### The Obhyash V1 Approach: "Early Access" Model

Launch with a **3-month free premium window** for all signups. After 3 months, accounts that haven't subscribed roll back to a generous free tier — not a punishing one.

```
Signup (Day 0) ──── 3-month free Pro access ──── Gentle downgrade prompt ──── Free Tier
                                                          ↓
                                            "তুমি ৩ মাস আমাদের সাথে ছিলে —
                                             এখন Admission Session মাত্র ৳499"
```

This gives students time to:

- Form a daily practice habit
- Experience every premium feature
- Bring their friends (referral loop)
- Feel the value _before_ being asked to pay

---

## 📋 V1 Feature Scope (Prioritized Build List)

### 🔴 Phase 1 — Must Have Before Launch (2–3 weeks)

#### 1. Exam Target Onboarding

**What**: On first login/signup, ask "তুমি কোন পরীক্ষার জন্য প্রস্তুতি নিচ্ছ?"

- [ ] HSC 2026
- [ ] HSC 2027
- [ ] MBBS Admission 2026
- [ ] BUET Admission 2026
- [ ] SSC 2026
- [ ] Other

**Why**: Personalizes dashboard subject order, exam countdown, and push notification content. Huge first-impression improvement.

**Effort**: 2–3 days (new modal on first login, store `exam_target` in `users` table)

---

#### 2. Exam Countdown Widget

**What**: A small badge on the dashboard header showing days remaining to the student's target exam.

```
"🎯 MBBS Admission: ৮৭ দিন বাকি"
```

**Why**: Creates daily urgency. Students see it every time they open the app.

**Effort**: 1 day (date calculation from exam_target field + static date map)

---

#### 3. Fix Subscription Plans (No Paywall Yet — Just Show Plans)

**What**: Update the subscription plans to the new pricing but keep all features unlocked during the launch window. The plans page should show the value clearly but not block anything yet.

New plans to add in `seed_subscription_plans.sql`:
| Plan | Price | Duration |
|------|-------|----------|
| ফ্রি (Free) | ৳0 | Forever |
| এক্সাম রেডি | ৳149 | 30 days |
| প্রো | ৳349 | 90 days |
| সেশন (Annual) | ৳599 | 365 days |

**Why**: Show students what they'll eventually pay for. Plant the pricing in their mind early.

**Effort**: 1 day (SQL seed update + UI label tweak)

---

#### 4. Today's Daily Goal Widget

**What**: A progress ring on the dashboard showing a daily practice goal.

```
আজকের লক্ষ্য: ১০টি MCQ সম্পন্ন করো
[=====>    ] ৫/১০ সম্পন্ন
```

**Why**: Duolingo-proven habit loop. Students who come back daily have 40× higher LTV.

**Effort**: 3–4 days (daily goal config, track exams count per UTC day, ring component)

---

#### 5. Wrong Answer Review Mode

**What**: After any exam result, a new button "ভুলগুলো আবার দেখো" that starts a focused re-practice session with only the wrong answers from that exam.

**Why**: This is what serious students _actually_ want. Every medical aspirant re-does wrong questions 3–5 times. Currently they have to manually scroll through and note them down.

**Effort**: 3–4 days (filter questions from exam result by user_answers, launch in focused mode)

---

#### 6. Chapter Progress Map (Simplified V1)

**What**: A subject detail view showing chapter-wise accuracy as a horizontal progress bar.

```
📚 পদার্থবিজ্ঞান
  ▸ বলবিদ্যা        ████████░░  80%   (25 প্রশ্ন)
  ▸ আলোকবিজ্ঞান     █████░░░░░  50%   (12 প্রশ্ন)
  ▸ তাপগতিবিদ্যা    ██░░░░░░░░  20%   (8 প্রশ্ন)
```

**Why**: Students instantly see where they're weak. This alone will drive them back daily.

**Effort**: 4–5 days (aggregate from exam_results + questions topic/chapter fields)

---

### 🟡 Phase 2 — Launch + First 4 Weeks

#### 7. Daily Push Notification — Question of the Day

**What**: One daily notification at 8 AM: "আজকের প্রশ্ন: পদার্থবিজ্ঞান — এই প্রশ্নটি কতজন পারবে?"

Students tap → go directly to a single-question quick-answer screen → see result + explanation → optionally start full practice.

**Why**: Re-engagement #1 tool. Open rates for personalized quiz notifications are 35–45% in education apps.

**Effort**: 1 week (scheduled notification API, quick-answer UI, FCM/web push setup)

---

#### 8. Bookmark Feature

**What**: Heart/bookmark icon on every question. Saved questions accessible from a "বুকমার্ক" tab in history.

**Why**: Students manually screenshot hard questions right now. This replaces that behavior and keeps them in the app.

**Effort**: 3–4 days (bookmarks table in Supabase, already have `use-bookmarks.ts` hook)

---

#### 9. Referral Reward — Automated (not manual)

**What**: Currently referrals need admin approval. Automate it: when a referral code is used and the referred user completes signup + 1 exam, both referrer and referee get **30 days free Pro** automatically.

**Why**: Manual approval creates delays and kills viral word-of-mouth. The referral program is built — just make it instant.

**Effort**: 2–3 days (trigger on exam completion + subscription extension logic)

---

#### 10. Subscription Plans — Proper "Annual" Plan + Comparison Table

**What**: A redesigned subscription page with:

- Annual plan prominently first: "মাত্র ৳1.64/দিন"
- A feature comparison table (Free vs Pro vs Session)
- Coaching center price comparison: "যেখানে কোচিং নেয় ৳30,000/বছর"
- Countdown to launch window expiry: "আপনার ফ্রি প্রিমিয়াম আর ৪৫ দিন বাকি"

**Effort**: 3–4 days (UI redesign + SQL plan update)

---

### 🟢 Phase 3 — Month 2 (Post-Launch Stabilization)

#### 11. bKash/Nagad Automated Payment

**What**: Integrate bKash Payment Gateway API. Student pays within the app, payment verified via API, subscription activates instantly — no admin needed.

**Why**: Manual approval loses ~30–40% of payment completions. This is the single highest-ROI backend task.

**Effort**: 2 weeks (bKash developer API integration, webhook handling, subscription auto-activation)

**API**: [developer.bka.sh](https://developer.bka.sh) — has sandbox for testing

---

#### 12. Friend Challenge / Duel Mode

**What**: "বন্ধুকে চ্যালেঞ্জ করো" — generates a shareable link to a specific exam. Friend takes the same exam, scores compared on a result screen.

```
তুমি vs রাফি
Physics MCQ (20 প্রশ্ন)
তুমি: 85%  🏆
রাফি: 72%
```

**Why**: Viral mechanic. Every challenge shared is an acquisition channel. Already have result share card infrastructure for this.

**Effort**: 1 week (challenge link generation, same-exam assignment, dual result view)

---

#### 13. Personalized Weak Topic Alert

**What**: If a student scores below 50% in any chapter 2+ times in a row, show a notification:
"তোমার পদার্থবিজ্ঞানের 'তাপগতিবিদ্যা' চ্যাপ্টারে সমস্যা হচ্ছে। আজ এটি অনুশীলন করো?"

**Why**: Feels like a personal tutor. Extremely sticky feature.

**Effort**: 3–4 days (chapter history aggregation + threshold rule + notification trigger)

---

## 💰 V1 Subscription Model — "Trust First"

### The Launch Window Plan

```
V1 Launch
    │
    ├── All signups get FREE PRO for 90 days (automatic)
    │
    ├── Day 60: Gentle nudge — "আর ৩০ দিন ফ্রি বাকি"
    │
    ├── Day 80: Urgency nudge — "আর ১০ দিন! সেশন প্ল্যান মাত্র ৳499"
    │
    └── Day 90: Roll back to Free Tier (generous, not punishing)
                    ↓
            Free Tier allows:
            - 5 exams/week
            - Score + wrong answer list
            - Basic analytics
            - Leaderboard
            - Blog
            - Referral (still earns rewards)
```

### Why This Works

1. Students form a **habit** in 90 days — they'll feel the downgrade
2. By day 90, they've seen the full value — subscription feels worth it
3. Referral rewards keep growing the user base throughout
4. No one leaves on day 1 because of a paywall

### Free Tier (After Launch Window)

| Feature               | Free                      |
| --------------------- | ------------------------- |
| Exams per week        | 5                         |
| Wrong answer review   | ✅ (their own past exams) |
| Basic analytics       | ✅                        |
| Leaderboard           | ✅                        |
| Referral              | ✅                        |
| Blog                  | ✅                        |
| Bookmark              | ✅ (up to 20)             |
| Chapter progress map  | ❌ (teased, blurred)      |
| AI explanation        | ❌ (3 free/month)         |
| OMR scan              | ❌                        |
| Daily goal (advanced) | ❌                        |
| Unlimited exams       | ❌                        |

### Upgrade Trigger Points (Contextual — Not Annoying)

Show upgrade prompts **only at emotional high points**, never randomly:

| Moment                           | Prompt                                                                |
| -------------------------------- | --------------------------------------------------------------------- |
| Student gets question wrong      | "AI-এর সাহায্যে এই প্রশ্নটি বুঝো → Pro-তে আপগ্রেড করো"                |
| 5 exam/week limit hit            | "এই সপ্তাহের এক্সাম শেষ। আরও প্র্যাকটিস করতে চাও?"                    |
| Chapter progress map blurred     | "সব চ্যাপ্টারের অগ্রগতি দেখতে Pro ব্যবহার করো"                        |
| 60 days before their target exam | "MBBS Admission মাত্র ৬০ দিন বাকি — Pro-তে আপগ্রেড করে প্রস্তুতি নাও" |

---

## 🚀 Launch Checklist

### Week 1–2: Pre-Launch Prep

- [ ] Exam target onboarding screen
- [ ] Update subscription plans SQL (new pricing)
- [ ] 90-day free Pro logic for new signups
- [ ] Exam countdown widget on dashboard
- [ ] Fix any critical bugs in existing features

### Week 3–4: Core Features

- [ ] Wrong answer review mode
- [ ] Daily goal widget (simple version)
- [ ] Bookmark feature (uses existing `use-bookmarks.ts`)
- [ ] Referral reward automation

### Month 2: Engagement & Growth

- [ ] Chapter progress map
- [ ] Daily push notification
- [ ] Subscription page redesign (annual plan prominent)
- [ ] Launch Telegram community

### Month 3: Monetization Ready

- [ ] bKash automated payment integration
- [ ] Friend challenge / duel mode
- [ ] Personalized weak topic alerts
- [ ] Convert "launch window" users → paid

---

## 📊 V1 Success Metrics (Track from Day 1)

| Metric                     | Week 1 Target | Month 1 Target | Month 3 Target |
| -------------------------- | ------------- | -------------- | -------------- |
| Signups                    | 50            | 500            | 2,000          |
| DAU (Daily Active Users)   | 20            | 150            | 600            |
| Exams per user per week    | 2             | 5              | 8              |
| Referral conversions       | 5             | 50             | 200            |
| Paid subscribers           | 0             | 0              | 100            |
| DAU/MAU ratio (stickiness) | —             | 20%            | 35%            |

> **Key signal to watch**: If DAU/MAU is above 30%, you have strong retention — monetization will follow naturally.

---

## 🧭 One-Page Summary

| Phase            | Timeline     | Focus                                                           |
| ---------------- | ------------ | --------------------------------------------------------------- |
| **Pre-launch**   | Now → Week 2 | Onboarding, countdown, plan updates                             |
| **V1 Launch**    | Week 3       | All existing features + new quick wins, free Pro for all        |
| **Engagement**   | Month 2      | Habit-forming features (daily goal, chapter map, notifications) |
| **Monetization** | Month 3      | bKash API, upgrade prompts, convert launch-window users         |
| **Growth**       | Month 4–6    | Friend challenge, B2B coaching deals, teacher affiliates        |

> **The goal of V1 is not revenue. The goal is 500 students who open Obhyash every day.**
> Revenue follows retention. Retention follows habit. Habit follows a great free experience.

---

_Document: Obhyash V1 Launch Plan — March 2026_
