import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/app_config_model.dart';
import 'shared_prefs_provider.dart';

// Current App Version (can be bumped on releases)
const String kCurrentAppVersion = '1.0.0';

/// Realtime Stream Provider for Master App Configuration
final appConfigStreamProvider = StreamProvider<AppConfigModel>((ref) {
  final supabase = Supabase.instance.client;

  return supabase
      .from('app_config')
      .stream(primaryKey: ['id'])
      .eq('id', 'global_config')
      .map((data) {
        if (data.isEmpty) {
          return const AppConfigModel();
        }
        return AppConfigModel.fromJson(data.first);
      });
});

/// Evaluates if Force Update is required based on minAppVersion (with offline persistence)
final isForceUpdateRequiredProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  final prefs = ref.watch(sharedPreferencesProvider);

  return configAsync.maybeWhen(
    data: (config) {
      final isRequired = config.forceUpdate &&
          _isVersionOlder(kCurrentAppVersion, config.minAppVersion);
      // Persist state locally so airplane mode or disconnecting data cannot bypass
      prefs.setBool('cached_force_update_required', isRequired);
      if (isRequired) {
        prefs.setString('cached_min_app_version', config.minAppVersion);
        prefs.setString('cached_update_url', config.updateUrl);
      }
      return isRequired;
    },
    orElse: () {
      // Offline fallback: verify cached lock
      final cachedRequired =
          prefs.getBool('cached_force_update_required') ?? false;
      final cachedMin = prefs.getString('cached_min_app_version') ?? '1.0.0';
      if (cachedRequired && _isVersionOlder(kCurrentAppVersion, cachedMin)) {
        return true;
      }
      return false;
    },
  );
});

/// Evaluates if Live Exams are enabled globally
final isLiveExamsEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.liveExamsEnabled,
    orElse: () => true,
  );
});

/// Evaluates if Single Device Login lock is enabled globally
final isSingleDeviceLoginEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.singleDeviceLoginEnabled,
    orElse: () => true,
  );
});

/// Evaluates if Screenshot & Screen Recording protection is enabled globally
final isScreenshotProtectionEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.screenshotProtectionEnabled,
    orElse: () => false, // Default to false until config loads
  );
});

/// Evaluates if Live Exam Anti-Cheat Guard is enabled globally
final isExamAntiCheatEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.examAntiCheatEnabled,
    orElse: () => true,
  );
});

/// Gets max tab switches allowed before auto submit
final maxTabSwitchesAllowedProvider = Provider<int>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.maxTabSwitchesAllowed,
    orElse: () => 2,
  );
});

/// Evaluates if Payment Gateways are enabled globally
final isPaymentsEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.paymentsEnabled,
    orElse: () => true,
  );
});

/// Evaluates if Leaderboard is visible globally
final isLeaderboardEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.leaderboardEnabled,
    orElse: () => true,
  );
});

/// Gets max free exams per day for non-pro students
final maxFreeExamsPerDayProvider = Provider<int>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.maxFreeExamsPerDay,
    orElse: () => 5,
  );
});

/// Compares semver version strings: returns true if current < min
bool _isVersionOlder(String current, String min) {
  try {
    final currentParts = current.split('.').map(int.parse).toList();
    final minParts = min.split('.').map(int.parse).toList();

    for (int i = 0; i < 3; i++) {
      final curr = i < currentParts.length ? currentParts[i] : 0;
      final m = i < minParts.length ? minParts[i] : 0;
      if (curr < m) return true;
      if (curr > m) return false;
    }
    return false;
  } catch (_) {
    return false;
  }
}

