// lib/services/session_monitor_service.dart
//
// Detects when the user's account is signed in on another device and
// forces the current device to sign out automatically.
//
// How it works:
//   1. On login, inserts a row to `user_sessions` table with device info.
//   2. Subscribes to Supabase Realtime changes on that table for this user.
//   3. When a *newer* session row appears, triggers forced sign-out.
//
// Required Supabase table:
//   -- Run this SQL in the Supabase dashboard once:
//   CREATE TABLE IF NOT EXISTS user_sessions (
//     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
//     session_id  text NOT NULL,
//     device_info text,
//     created_at  timestamptz DEFAULT now()
//   );
//   ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Users read own sessions" ON user_sessions
//     FOR SELECT USING (auth.uid() = user_id);
//   CREATE POLICY "Users insert own sessions" ON user_sessions
//     FOR INSERT WITH CHECK (auth.uid() = user_id);
//   CREATE POLICY "Users delete own sessions" ON user_sessions
//     FOR DELETE USING (auth.uid() = user_id);

import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'secure_storage_service.dart';

typedef ForceSignOutCallback = Future<void> Function();

class SessionMonitorService {
  SessionMonitorService._();

  static final _supabase = Supabase.instance.client;

  /// Active Realtime channel (kept alive while user is logged in).
  static RealtimeChannel? _channel;

  /// The session ID for the current device login.
  static String? _currentSessionId;

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Register this device's session and start monitoring for new logins.
  ///
  /// [userId] — current auth user ID.
  /// [onForcedSignOut] — callback invoked when a new device logs in.
  ///   Typically calls `AuthController.logout()` + navigation to LoginScreen.
  static Future<void> start({
    required String userId,
    required ForceSignOutCallback onForcedSignOut,
  }) async {
    // Read the stored session ID (set during login via SecureStorageService)
    final sessionId = await SecureStorageService.getSessionId();
    if (sessionId == null || sessionId.isEmpty) return;

    _currentSessionId = sessionId;

    // Write this session to the DB (upsert — handles reconnects gracefully)
    await _upsertSession(userId: userId, sessionId: sessionId);

    // Subscribe to Realtime inserts on user_sessions for this user
    _channel = _supabase
        .channel('session_monitor:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'user_sessions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) => _handleNewSession(
            payload: payload,
            onForcedSignOut: onForcedSignOut,
          ),
        )
        .subscribe();
  }

  /// Unsubscribe and clean up. Call on sign-out and app dispose.
  static Future<void> stop({required String userId}) async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
    // Remove this device's session row
    if (_currentSessionId != null) {
      await _supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', userId)
          .eq('session_id', _currentSessionId!);
    }
    _currentSessionId = null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  static Future<void> _upsertSession({
    required String userId,
    required String sessionId,
  }) async {
    try {
      final deviceInfo = _getDeviceInfo();
      await _supabase.from('user_sessions').upsert({
        'user_id': userId,
        'session_id': sessionId,
        'device_info': deviceInfo,
        'created_at': DateTime.now().toUtc().toIso8601String(),
      });
    } catch (e) {
      // Non-fatal — monitoring degrades gracefully if insert fails
      debugPrint('[SessionMonitor] Failed to upsert session: $e');
    }
  }

  static void _handleNewSession({
    required PostgresChangePayload payload,
    required ForceSignOutCallback onForcedSignOut,
  }) {
    final newRecord = payload.newRecord;
    final incomingSessionId = newRecord['session_id'] as String?;

    // Ignore if the new session is the same as ours (e.g. reconnect)
    if (incomingSessionId == null || incomingSessionId == _currentSessionId)
      return;

    debugPrint(
      '[SessionMonitor] New session detected: $incomingSessionId — forcing sign-out.',
    );

    // Trigger forced sign-out (caller handles UI toast + navigation)
    onForcedSignOut();
  }

  static String _getDeviceInfo() {
    try {
      if (kIsWeb) return 'web';
      if (Platform.isAndroid) return 'android';
      if (Platform.isIOS) return 'ios';
    } catch (_) {}
    return 'unknown';
  }
}
