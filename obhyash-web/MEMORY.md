# 🚨 CRITICAL MEMORY & PROTOCOL: ANDROID APP BUNDLE (.AAB) BUILD RULES

> **STATUS:** HIGHEST PRIORITY (সর্বোচ্চ অগ্রাধিকার)  
> **APPLIES TO:** Every `.aab` / Release Build for Google Play Store  
> **DATE RECORDED:** 2026-10-07  

---

## 🛑 MANDATORY RULE: PAYMENT GATEWAY CONFIGURATION FOR GOOGLE PLAY REVIEWS

Google Play Store enforces strict policies regarding In-App Purchases for digital goods (digital exams, subscriptions, question bank access). Direct third-party payment methods (bKash, Nagad, UddoktaPay, Send Money + TrxID) inside the Android app will trigger an instant policy violation, app rejection, or account strike.

### 📋 BEFORE RUNNING ANY `flutter build appbundle` OR CREATING AN `.aab` FILE:

1. **ONLY GOOGLE PLAY IN-APP BILLING ALLOWED:**
   - `payment_google_play_enabled`: **MUST BE TRUE / ON** ✅
   - Google Play Official Billing must be the only payment gateway active for digital subscriptions.

2. **ALL THIRD-PARTY PAYMENTS MUST BE TURNED OFF:**
   - `payment_auto_enabled` (UddoktaPay / bKash / Nagad / Cards): **MUST BE FALSE / OFF** ❌
   - `payment_manual_enabled` (Send Money TrxID Form): **MUST BE FALSE / OFF** ❌
   - Any direct phone numbers or bKash merchant numbers: **MUST BE HIDDEN** ❌

3. **CONTROL PANEL & DATABASE SAFETY:**
   - Ensure the `app_config` row in Supabase has `payment_auto_enabled: false` and `payment_manual_enabled: false` during the build and review period.
   - In Flutter code (`app_config_provider.dart`), ensure safe defaults so that even if the network fails during Google review, third-party payments NEVER accidentally render.

4. **POST-APPROVAL PROTOCOL:**
   - Only after Google Play Console changes status to **"Available on Google Play"** (Review Passed), can third-party payments be re-enabled from the Admin Control Panel if the user chooses.

---

### ⚠️ AGENT RESPONSIBILITY (PAIR PROGRAMMING CONTRACT):
- Whenever the user asks to "build aab", "release app", "update build", or "prepare release bundle", **the assistant MUST proactively check and verify this rule before executing any build command.**
- Do NOT proceed with building a production bundle without verifying that bKash/Nagad/manual payment toggles are OFF.
