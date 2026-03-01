// lib/services/secure_storage_service.dart
//
// Wraps flutter_secure_storage with a typed API for auth session management.
//
// Security:
//   Android — uses EncryptedSharedPreferences (AES-256 via Jetpack Security)
//   iOS     — uses the OS Keychain (hardware-backed on modern devices)
//
// Usage:
//   await SecureStorageService.saveSession(session);
//   final session = await SecureStorageService.getSession();
//   await SecureStorageService.clearSession();

import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Storage keys — keep them stable; changing them logs out all users.
const _kAccessToken = 'obhyash_access_token';
const _kRefreshToken = 'obhyash_refresh_token';
const _kSessionId = 'obhyash_session_id';
const _kUserId = 'obhyash_user_id';
const _kUserMeta = 'obhyash_user_meta'; // non-auth metadata (name, xp, rank)

/// Encrypted storage for JWT tokens and session state.
///
/// All methods are static — call them without instantiation:
///   `await SecureStorageService.saveSession(session)`
class SecureStorageService {
  SecureStorageService._(); // prevent instantiation

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true, // AES-256, API 23+
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // ── Session persistence ───────────────────────────────────────────────────

  /// Persist a full Supabase auth session to encrypted storage.
  /// Call this after every successful login or token refresh.
  static Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required String userId,
    required String sessionId,
  }) async {
    await Future.wait([
      _storage.write(key: _kAccessToken, value: accessToken),
      _storage.write(key: _kRefreshToken, value: refreshToken),
      _storage.write(key: _kUserId, value: userId),
      _storage.write(key: _kSessionId, value: sessionId),
    ]);
  }

  /// Read the persisted session. Returns null if no session is stored.
  static Future<StoredSession?> getSession() async {
    final values = await Future.wait([
      _storage.read(key: _kAccessToken),
      _storage.read(key: _kRefreshToken),
      _storage.read(key: _kUserId),
      _storage.read(key: _kSessionId),
    ]);

    final accessToken = values[0];
    final refreshToken = values[1];
    final userId = values[2];
    final sessionId = values[3];

    if (accessToken == null || refreshToken == null || userId == null) {
      return null;
    }

    return StoredSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: userId,
      sessionId: sessionId ?? '',
    );
  }

  /// Get just the current session ID (used by session monitor).
  static Future<String?> getSessionId() => _storage.read(key: _kSessionId);

  /// Remove all auth tokens from encrypted storage.
  /// Call this on explicit sign-out.
  static Future<void> clearSession() async {
    await Future.wait([
      _storage.delete(key: _kAccessToken),
      _storage.delete(key: _kRefreshToken),
      _storage.delete(key: _kUserId),
      _storage.delete(key: _kSessionId),
    ]);
  }

  // ── Non-sensitive user metadata ───────────────────────────────────────────
  // Stores lightweight UI metadata (name, xp, rank) for instant UI population.
  // Not auth-critical — safe on encrypted storage as a bonus.

  /// Persist non-sensitive user metadata for instant UI load without flicker.
  static Future<void> saveUserMeta(Map<String, dynamic> meta) async {
    await _storage.write(key: _kUserMeta, value: jsonEncode(meta));
  }

  /// Read cached user metadata. Returns an empty map if not stored.
  static Future<Map<String, dynamic>> getUserMeta() async {
    final raw = await _storage.read(key: _kUserMeta);
    if (raw == null) return {};
    try {
      return Map<String, dynamic>.from(jsonDecode(raw) as Map);
    } catch (_) {
      return {};
    }
  }

  /// Clear cached user metadata (call alongside clearSession on logout).
  static Future<void> clearUserMeta() => _storage.delete(key: _kUserMeta);
}

// ── Value objects ─────────────────────────────────────────────────────────────

/// Immutable snapshot of a persisted auth session.
class StoredSession {
  const StoredSession({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.sessionId,
  });

  final String accessToken;
  final String refreshToken;
  final String userId;
  final String sessionId;
}
