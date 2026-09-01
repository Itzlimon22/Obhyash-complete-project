import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// DeviceService manages hardware-bound and secure persistent device identifiers
/// for anti-fraud, referral abuse protection, and session security.
class DeviceService {
  static const String _key = 'obhyash_persistent_device_id';
  static const _secureStorage = FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static String? _cachedDeviceId;

  /// Retrieves or generates a unique, persistent device ID.
  /// Persists across logouts, multiple accounts, and app restarts.
  static Future<String> getDeviceId() async {
    if (_cachedDeviceId != null && _cachedDeviceId!.isNotEmpty) {
      return _cachedDeviceId!;
    }

    try {
      // 1. Try reading from secure storage (hardware keychain / keystore)
      final secureId = await _secureStorage.read(key: _key);
      if (secureId != null && secureId.startsWith('dev_flutter_')) {
        _cachedDeviceId = secureId;
        return secureId;
      }
    } catch (_) {}

    try {
      // 2. Fallback check from shared preferences
      final prefs = await SharedPreferences.getInstance();
      final prefId = prefs.getString(_key);
      if (prefId != null && prefId.startsWith('dev_flutter_')) {
        _cachedDeviceId = prefId;
        // Sync to secure storage
        try {
          await _secureStorage.write(key: _key, value: prefId);
        } catch (_) {}
        return prefId;
      }
    } catch (_) {}

    // 3. Generate a new permanent device ID
    final random = Random.secure();
    final values = List<int>.generate(16, (i) => random.nextInt(256));
    final hex = values.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    final timeStr = DateTime.now().millisecondsSinceEpoch.toRadixString(36);
    final newId = 'dev_flutter_${timeStr}_$hex';

    // 4. Save to both storage layers
    try {
      await _secureStorage.write(key: _key, value: newId);
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, newId);
    } catch (_) {}

    _cachedDeviceId = newId;
    return newId;
  }
}
