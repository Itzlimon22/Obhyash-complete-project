/// Global Application Configuration & Feature Flags
class AppConfig {
  /// Toggle for SMS OTP Phone Verification during student registration.
  /// - Set to [false] when Bulk SMS is not active (bypasses SMS code prompt directly).
  /// - Set to [true] when Bulk SMS is purchased to instantly re-enable SMS verification.
  static const bool enableSmsOtpVerification = false;

  /// Google OAuth Web Client ID (from Google Cloud Console -> Credentials -> Web client 1)
  /// Required for generating valid backend idTokens in native Android Google Sign-In.
  static const String googleWebClientId =
      '39442338897-29slm501ptu95iikh9fbcs85s8fc45ho.apps.googleusercontent.com';
}

