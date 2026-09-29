import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/app_config_model.dart';
import 'shared_prefs_provider.dart';

/// Overridden in main.dart with actual platform package info
final packageInfoProvider = Provider<PackageInfo?>((ref) => null);

/// Fallback or real app version
final currentAppVersionProvider = Provider<String>((ref) {
  final info = ref.watch(packageInfoProvider);
  if (info != null) {
    return '${info.version}+${info.buildNumber}';
  }
  return '1.0.0+5';
});

// Backward-compatible constant fallback
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
  final currentVersion = ref.watch(currentAppVersionProvider);

  return configAsync.maybeWhen(
    data: (config) {
      final isRequired = config.forceUpdate &&
          _isVersionOlder(currentVersion, config.minAppVersion);
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
      if (cachedRequired && _isVersionOlder(currentVersion, cachedMin)) {
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

/// Evaluates if Automatic Payment (UddoktaPay: bKash, Nagad, Cards) is enabled
final isPaymentAutoEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.paymentsEnabled && config.paymentAutoEnabled,
    orElse: () => false,
  );
});

/// Evaluates if Manual Payment (Send Money + TrxID) is enabled
final isPaymentManualEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.paymentsEnabled && config.paymentManualEnabled,
    orElse: () => false,
  );
});

/// Evaluates if Google Play In-App Purchase is enabled
final isPaymentGooglePlayEnabledProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.paymentsEnabled && config.paymentGooglePlayEnabled,
    orElse: () => true,
  );
});

/// Dynamic Merchant Number for Manual Payment from app_config
final manualPaymentMerchantNumberProvider = Provider<String>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) => config.manualPaymentMerchantNumber,
    orElse: () => '01749591456',
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
    orElse: () => 2,
  );
});

/// Compares semver version strings and build numbers: returns true if current < min
bool _isVersionOlder(String current, String min) {
  try {
    final currentClean = current.split('+').first.trim();
    final minClean = min.split('+').first.trim();

    final currentParts = currentClean.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final minParts = minClean.split('.').map((e) => int.tryParse(e) ?? 0).toList();

    for (int i = 0; i < 3; i++) {
      final curr = i < currentParts.length ? currentParts[i] : 0;
      final m = i < minParts.length ? minParts[i] : 0;
      if (curr < m) return true;
      if (curr > m) return false;
    }

    // If major.minor.patch are identical, compare build number if available
    if (current.contains('+') && min.contains('+')) {
      final currBuild = int.tryParse(current.split('+').last.trim()) ?? 0;
      final minBuild = int.tryParse(min.split('+').last.trim()) ?? 0;
      if (currBuild < minBuild) return true;
    }

    return false;
  } catch (_) {
    return false;
  }
}

