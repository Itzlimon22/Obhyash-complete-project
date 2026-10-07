# 🚨 CRITICAL MEMORY: AAB BUILD PAYMENT SAFETY PROTOCOL

> **STATUS:** HIGHEST PRIORITY (সর্বোচ্চ অগ্রাধিকার)  
> **APPLIES TO:** Every `.aab` / Release Build for Google Play Store  

---

## 🛑 MANDATORY RULE BEFORE CREATING `.aab` (APP BUNDLE)

1. **ONLY Google Play In-App Purchase ALLOWED:**
   - `payment_google_play_enabled = true`
2. **ALL 3rd-Party Payments MUST BE DISABLED:**
   - `payment_auto_enabled = false` (bKash, Nagad, UddoktaPay)
   - `payment_manual_enabled = false` (Send Money + TrxID)
3. **NEVER BUILD `.aab` WITH bKash/Nagad FORM VISIBLE:**
   - Google Play Reviewers will instantly reject or suspend the app if third-party digital payment methods are found during review.
   - Only turn bKash/Nagad on via the Admin Control Panel *after* Google Play review is approved ("Available on Google Play").
