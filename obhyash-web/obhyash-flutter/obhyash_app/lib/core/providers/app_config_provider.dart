import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/app_config_model.dart';

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

/// Evaluates if Force Update is required based on minAppVersion
final isForceUpdateRequiredProvider = Provider<bool>((ref) {
  final configAsync = ref.watch(appConfigStreamProvider);
  return configAsync.maybeWhen(
    data: (config) {
      if (!config.forceUpdate) return false;
      return _isVersionOlder(kCurrentAppVersion, config.minAppVersion);
    },
    orElse: () => false,
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
