import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:in_app_update/in_app_update.dart';

/// Service to handle Google Play In-App Updates.
///
/// Triggers Google Play's native In-App Update flow:
/// - Flexible Update: Displays Google Play's native bottom-sheet window
///   (showing Google Play logo, App name, rating, size, "What's new", and Update button)
///   while allowing the user to continue using the app in background.
/// - Immediate Update: Fullscreen mandatory update when required.
class InAppUpdateService {
  static bool _isChecking = false;

  /// Check Google Play Store for updates.
  /// Prioritizes the native Flexible Update bottom sheet (exact Google Play modal).
  static Future<void> checkForUpdate({bool forceImmediate = false}) async {
    // In-app update API is only supported on Android devices with Google Play Store
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

      // 2. If a new update is available on Google Play
      if (info.updateAvailability == UpdateAvailability.updateAvailable) {
        if (!forceImmediate && info.flexibleUpdateAllowed) {
          debugPrint('[InAppUpdate] Launching Google Play Flexible Update bottom sheet...');
          // Displays the exact native Google Play bottom sheet modal
          final result = await InAppUpdate.startFlexibleUpdate();
          debugPrint('[InAppUpdate] Flexible update download result: $result');

          if (result == AppUpdateResult.success) {
            debugPrint('[InAppUpdate] Update downloaded successfully. Completing install...');
            await InAppUpdate.completeFlexibleUpdate();
          }
        } else if (info.immediateUpdateAllowed) {
          debugPrint('[InAppUpdate] Launching Google Play Immediate Update...');
          final result = await InAppUpdate.performImmediateUpdate();
          debugPrint('[InAppUpdate] Result: $result');
        }
      } else {
        debugPrint('[InAppUpdate] App is up to date on Google Play.');
      }
    } catch (e) {
      // In local debug/sideload builds, Google Play returns ERROR_API_NOT_AVAILABLE.
      // We safely catch this so the app runs smoothly without disruption.
      debugPrint('[InAppUpdate] Google Play check skipped or failed: $e');
    } finally {
      _isChecking = false;
    }
  }

  /// Backward-compatible alias for existing startup calls
  static Future<void> checkForImmediateUpdate() => checkForUpdate();
}

