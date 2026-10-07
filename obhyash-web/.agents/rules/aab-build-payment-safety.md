# AAB Build & Google Play Payment Safety Rule

## Priority: HIGHEST / CRITICAL

### Trigger:
Whenever any command or task involves building an Android App Bundle (`.aab`), release APK, or preparing a Google Play Store update for Obhyash (`com.obhyash.app`):

### Mandatory Enforcement:
1. **Google Play In-App Purchase ONLY:**
   - `payment_google_play_enabled` must be `true`.
   - Google Play Billing is the ONLY allowed payment method visible in the app during review.
2. **Third-Party Payments OFF:**
   - `payment_auto_enabled` (bKash/Nagad/UddoktaPay) must be `false`.
   - `payment_manual_enabled` (Send Money TrxID) must be `false`.
   - No direct personal/merchant bKash/Nagad numbers or forms may appear.
3. **Safety Verification:**
   - Before building the `.aab` (`flutter build appbundle`), verify that `app_config` and default fallbacks enforce these settings.
   - Third-party payments may only be toggled back on via Control Panel after the release has been officially reviewed and approved by Google.
