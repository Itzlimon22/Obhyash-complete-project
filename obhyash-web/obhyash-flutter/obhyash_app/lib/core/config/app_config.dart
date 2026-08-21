/// Global Application Configuration & Feature Flags
class AppConfig {
  /// Toggle for SMS OTP Phone Verification during student registration.
  /// - Set to [false] when Bulk SMS is not active (bypasses SMS code prompt directly).
  /// - Set to [true] when Bulk SMS is purchased to instantly re-enable SMS verification.
  static const bool enableSmsOtpVerification = false;
}
