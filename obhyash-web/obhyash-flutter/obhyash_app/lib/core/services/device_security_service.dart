import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'device_service.dart';

class DeviceBlockInfo {
  final bool isBlocked;
  final String? deviceId;
  final String? reason;

  const DeviceBlockInfo({
    this.isBlocked = false,
    this.deviceId,
    this.reason,
  });
}

final deviceBlockStreamProvider = AsyncNotifierProvider<DeviceSecurityNotifier, DeviceBlockInfo>(
  DeviceSecurityNotifier.new,
);

class DeviceSecurityNotifier extends AsyncNotifier<DeviceBlockInfo> {
  static const String _cachedBlockKey = 'obhyash_cached_device_is_blocked';
  static const String _cachedReasonKey = 'obhyash_cached_device_block_reason';
  RealtimeChannel? _subscription;

  @override
  Future<DeviceBlockInfo> build() async {
    final prefs = await SharedPreferences.getInstance();
    final cachedBlocked = prefs.getBool(_cachedBlockKey) ?? false;
    final cachedReason = prefs.getString(_cachedReasonKey);

    final deviceId = await DeviceService.getDeviceId();

    // 1. If locally flagged as blocked, enforce immediately (offline lock)
    if (cachedBlocked) {
      _startRealtimeListener(deviceId);
      return DeviceBlockInfo(
        isBlocked: true,
        deviceId: deviceId,
        reason: cachedReason,
      );
    }

    // 2. Query Supabase for remote check
    try {
      final supabase = Supabase.instance.client;
      final response = await supabase
          .from('blocked_devices')
          .select('device_id, reason')
          .eq('device_id', deviceId)
          .maybeSingle();

      final isBlocked = response != null;
      final reason = response?['reason']?.toString();

      if (isBlocked) {
        await prefs.setBool(_cachedBlockKey, true);
        if (reason != null) await prefs.setString(_cachedReasonKey, reason);
        try {
          await supabase.auth.signOut();
        } catch (_) {}
      } else {
        await prefs.remove(_cachedBlockKey);
        await prefs.remove(_cachedReasonKey);
      }

      _startRealtimeListener(deviceId);

      return DeviceBlockInfo(
        isBlocked: isBlocked,
        deviceId: deviceId,
        reason: reason,
      );
    } catch (e) {
      // Table might not exist yet, or network is down
      debugPrint('[DeviceSecurityNotifier] Blocked devices check: $e');
      _startRealtimeListener(deviceId);
      return DeviceBlockInfo(
        isBlocked: cachedBlocked,
        deviceId: deviceId,
        reason: cachedReason,
      );
    }
  }

  void _startRealtimeListener(String deviceId) {
    _subscription?.unsubscribe();
    final supabase = Supabase.instance.client;

    try {
      _subscription = supabase
          .channel('public:blocked_devices:$deviceId')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'blocked_devices',
            filter: PostgresChangeFilter(
              type: PostgresChangeFilterType.eq,
              column: 'device_id',
              value: deviceId,
            ),
            callback: (payload) async {
              final prefs = await SharedPreferences.getInstance();

              if (payload.eventType == PostgresChangeEvent.delete) {
                // Admin unblocked this device
                await prefs.remove(_cachedBlockKey);
                await prefs.remove(_cachedReasonKey);

                state = AsyncData(DeviceBlockInfo(
                  isBlocked: false,
                  deviceId: deviceId,
                  reason: null,
                ));
              } else {
                final newRow = payload.newRecord;
                final reason = newRow['reason']?.toString();

                await prefs.setBool(_cachedBlockKey, true);
                if (reason != null) await prefs.setString(_cachedReasonKey, reason);

                try {
                  await Supabase.instance.client.auth.signOut();
                } catch (_) {}

                state = AsyncData(DeviceBlockInfo(
                  isBlocked: true,
                  deviceId: deviceId,
                  reason: reason,
                ));
              }
            },
          )
          .subscribe();
    } catch (_) {}
  }
}
