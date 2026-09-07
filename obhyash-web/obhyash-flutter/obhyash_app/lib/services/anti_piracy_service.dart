import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Service to protect app content from unauthorized screenshots and screen recordings.
/// Uses native Android WindowManager.LayoutParams.FLAG_SECURE.
class AntiPiracyService {
  AntiPiracyService._();

  static const MethodChannel _channel =
      MethodChannel('com.obhyash.app/secure_window');

  static bool _isSecureActive = false;

  /// True if screenshot/screen recording blocking is currently enabled on native window.
  static bool get isSecureActive => _isSecureActive;

  /// Enables screen capture / screenshot blocking (FLAG_SECURE on Android).
  static Future<void> enableProtection() async {
    if (kIsWeb) return;
    try {
      await _channel.invokeMethod('enableSecure');
      _isSecureActive = true;
      debugPrint('[AntiPiracyService] 🛡️ Screenshot & screen recording protection ENABLED.');
    } catch (e) {
      debugPrint('[AntiPiracyService] Error enabling protection: $e');
    }
  }

  /// Disables screen capture blocking.
  static Future<void> disableProtection() async {
    if (kIsWeb) return;
    try {
      await _channel.invokeMethod('disableSecure');
      _isSecureActive = false;
      debugPrint('[AntiPiracyService] 🔓 Screenshot protection DISABLED.');
    } catch (e) {
      debugPrint('[AntiPiracyService] Error disabling protection: $e');
    }
  }

  /// Dynamically syncs protection state based on global admin config.
  static Future<void> setProtection(bool enabled) async {
    if (enabled) {
      await enableProtection();
    } else {
      await disableProtection();
    }
  }
}
