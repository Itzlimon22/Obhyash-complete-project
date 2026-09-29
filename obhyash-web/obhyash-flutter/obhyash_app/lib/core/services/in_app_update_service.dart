import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:in_app_update/in_app_update.dart';

/// Service to handle Google Play In-App Updates (Immediate / Mandatory)
class InAppUpdateService {
  static bool _isChecking = false;

  /// Check Google Play Store for immediate update.
  /// If an update is available or in progress, launches Google Play's native modal
  /// and freezes the app until update completes.
  static Future<void> checkForImmediateUpdate() async {
    // In-app update API is only supported on Android with Google Play Store
    if (kIsWeb || !Platform.isAndroid) return;
    if (_isChecking) return;

    _isChecking = true;
    try {
      final AppUpdateInfo info = await InAppUpdate.checkForUpdate();

      // 1. If an immediate update was already started and user resumed app
      if (info.updateAvailability ==
          UpdateAvailability.developerTriggeredUpdateInProgress) {
        debugPrint('[InAppUpdate] Resuming in-progress immediate update...');
        await InAppUpdate.performImmediateUpdate();
        return;
      }

      // 2. If a new update is available on Play Store
      if (info.updateAvailability == UpdateAvailability.updateAvailable) {
        if (info.immediateUpdateAllowed) {
          debugPrint('[InAppUpdate] Launching Google Play Immediate Update...');
          final result = await InAppUpdate.performImmediateUpdate();
          debugPrint('[InAppUpdate] Result: $result');
        } else if (info.flexibleUpdateAllowed) {
          // Fallback to flexible if immediate is not permitted by Play Store config
          debugPrint('[InAppUpdate] Flexible update allowed. Starting...');
          await InAppUpdate.startFlexibleUpdate();
          await InAppUpdate.completeFlexibleUpdate();
        }
      } else {
        debugPrint('[InAppUpdate] App is up to date on Google Play.');
      }
    } catch (e) {
      // In local debug/sideload builds, Google Play returns ERROR_API_NOT_AVAILABLE
      // or InstallErrorCode. We catch this safely so app never crashes.
      debugPrint('[InAppUpdate] Google Play check skipped or failed: $e');
    } finally {
      _isChecking = false;
    }
  }
}
