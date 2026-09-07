// lib/services/session_monitor_service.dart
//
// Single Device Session Lock:
// Detects when the user signs in on another device and automatically & silently
// logs out any previous devices.
//
// Works via:
//   1. Unique session ID per device stored locally.
//   2. Supabase Realtime listener on `public.users.current_session_id`.
//   3. Lifecycle resume check to handle background/sleeping apps.

import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'secure_storage_service.dart';

typedef ForceSignOutCallback = Future<void> Function();

class SessionMonitorService {
  SessionMonitorService._();

  static final _supabase = Supabase.instance.client;

  /// Active Realtime channel for session changes.
  static RealtimeChannel? _channel;

  /// The active session ID on this local device.
  static String? _currentSessionId;

  /// Generates a cryptographically unique session ID.
  static String generateSessionId(String userId) {
    final random = Random.secure();
    final values = List<int>.generate(12, (i) => random.nextInt(256));
    final hex = values.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${DateTime.now().millisecondsSinceEpoch}_$hex';
  }

  /// Checks whether single device login restriction is enabled by admin in app_config.
  static Future<bool> isLockEnabled() async {
    try {
      final res = await _supabase
          .from('app_config')
          .select('single_device_login_enabled')
          .eq('id', 'global_config')
          .maybeSingle();
      if (res != null && res['single_device_login_enabled'] != null) {
        return res['single_device_login_enabled'] as bool;
      }
    } catch (_) {}
    return true; // Default to true if not configured
  }

  /// Sets the active session ID in Supabase.
  static Future<void> registerActiveSession(String userId, String sessionId) async {
    _currentSessionId = sessionId;
    await SecureStorageService.saveSessionId(sessionId);

    try {
      await _supabase.rpc('set_active_user_session', params: {
        'p_session_id': sessionId,
      });
    } catch (_) {
      try {
        await _supabase.from('users').update({
          'current_session_id': sessionId,
        }).eq('id', userId);
      } catch (e) {
        debugPrint('[SessionMonitor] Error registering active session: $e');
      }
    }
  }

  /// Starts real-time monitoring of the user's active session.
  /// If a newer session appears in Supabase, silently invokes [onForcedSignOut].
  static Future<void> start({
    required String userId,
    required ForceSignOutCallback onForcedSignOut,
  }) async {
    // 1. Retrieve local session ID
    var sessionId = await SecureStorageService.getSessionId();
    if (sessionId == null || sessionId.isEmpty) {
      sessionId = generateSessionId(userId);
      await registerActiveSession(userId, sessionId);
    }
    _currentSessionId = sessionId;

    // 2. Initial synchronization check with DB
    try {
      final lockActive = await isLockEnabled();
      if (lockActive) {
        final res = await _supabase
            .from('users')
            .select('current_session_id')
            .eq('id', userId)
            .maybeSingle();

        final dbSessionId = res?['current_session_id'] as String?;
        if (dbSessionId != null &&
            dbSessionId.isNotEmpty &&
            dbSessionId != _currentSessionId) {
          debugPrint('[SessionMonitor] ⚠️ Stale session detected on startup. Silent auto-logout.');
          await onForcedSignOut();
          return;
        } else if (dbSessionId == null || dbSessionId.isEmpty) {
          await registerActiveSession(userId, _currentSessionId!);
        }
      }
    } catch (e) {
      debugPrint('[SessionMonitor] Startup sync check warning: $e');
    }

    // 3. Clean previous channel if active
    if (_channel != null) {
      try {
        await _supabase.removeChannel(_channel!);
      } catch (_) {}
      _channel = null;
    }

    // 4. Subscribe to Realtime UPDATE events on public.users for this user
    _channel = _supabase
        .channel('user_session_lock:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'users',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'id',
            value: userId,
          ),
          callback: (payload) async {
            final newRecord = payload.newRecord;
            final incomingSessionId = newRecord['current_session_id'] as String?;

            if (incomingSessionId != null &&
                incomingSessionId.isNotEmpty &&
                incomingSessionId != _currentSessionId) {
              final lockActive = await isLockEnabled();
              if (!lockActive) {
                debugPrint('[SessionMonitor] Single device lock disabled by admin. Allowing concurrent sessions.');
                return;
              }

              debugPrint(
                '[SessionMonitor] ⚠️ Account signed in on another device ($incomingSessionId). Silent logout triggered.',
              );
              onForcedSignOut();
            }
          },
        )
        .subscribe();
  }

  /// Verifies whether the local session is still the active session in DB.
  /// Call this when the app returns to foreground from sleep/background.
  static Future<void> checkSessionSync(
    String userId,
    ForceSignOutCallback onForcedSignOut,
  ) async {
    final lockActive = await isLockEnabled();
    if (!lockActive) return;

    final localId = _currentSessionId ?? await SecureStorageService.getSessionId();
    if (localId == null || localId.isEmpty) return;

    try {
      final res = await _supabase
          .from('users')
          .select('current_session_id')
          .eq('id', userId)
          .maybeSingle();

      final dbSessionId = res?['current_session_id'] as String?;
      if (dbSessionId != null && dbSessionId.isNotEmpty && dbSessionId != localId) {
        debugPrint('[SessionMonitor] ⚠️ Session replaced while app was inactive. Silent auto-logout.');
        await onForcedSignOut();
      }
    } catch (_) {}
  }

  /// Stops Realtime subscription on logout or dispose.
  static Future<void> stop({required String userId}) async {
    try {
      final ch = _channel;
      _channel = null;
      if (ch != null) {
        await _supabase.removeChannel(ch);
      }
      _currentSessionId = null;
    } catch (e) {
      debugPrint('[SessionMonitor] stop error: $e');
    }
  }
}

