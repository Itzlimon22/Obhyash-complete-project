import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../services/secure_storage_service.dart';
import '../../../services/session_monitor_service.dart';
import '../../dashboard/providers/dashboard_providers.dart';

final authControllerProvider = AsyncNotifierProvider<AuthController, void>(
  () => AuthController(),
);

class AuthController extends AsyncNotifier<void> {
  final SupabaseClient _supabase = Supabase.instance.client;

  @override
  FutureOr<void> build() {}

  // ── Login ─────────────────────────────────────────────────────────────────

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        final response = await _supabase.auth.signInWithPassword(
          email: email,
          password: password,
        );

        final session = response.session;
        final user = response.user;

        if (session != null && user != null) {
          // Derive a unique session ID from the JWT issued-at time + user ID.
          // This changes each time a new JWT is issued (i.e. each login).
          final sessionId = '${user.id}:${session.accessToken.hashCode}';

          // Persist tokens in AES-256 encrypted storage
          await SecureStorageService.saveSession(
            accessToken: session.accessToken,
            refreshToken: session.refreshToken ?? '',
            userId: user.id,
            sessionId: sessionId,
          );

          // Cache lightweight UI metadata for instant display on next open
          await SecureStorageService.saveUserMeta({
            'name': user.userMetadata?['full_name'] ?? '',
            'email': user.email ?? '',
          });

          // Ensure a `users` row exists — handles users who registered via
          // the web app or other platforms.  We upsert only the identity
          // fields; all other columns keep their existing values.
          try {
            await _supabase.from('users').upsert({
              'id': user.id,
              'email': user.email ?? '',
              'name':
                  user.userMetadata?['full_name'] ??
                  user.userMetadata?['name'] ??
                  'Student',
              'role':
                  user.userMetadata?['role'] ??
                  user.appMetadata['role'] ??
                  'Student',
              'last_active': DateTime.now().toIso8601String(),
            }, onConflict: 'id');
          } catch (upsertErr) {
            debugPrint(
              '[AuthController] users row upsert error (non-fatal): $upsertErr',
            );
          }

          // Start monitoring for logins on other devices
          await SessionMonitorService.start(
            userId: user.id,
            onForcedSignOut: () async => logout(forced: true),
          );

          // Force userProfileProvider to re-fetch now that the users row
          // is guaranteed to exist.  Avoids the race where the router
          // navigates to '/' (triggered by signedIn) before the upsert
          // above has completed, causing userProfileProvider to cache null.
          ref.invalidate(userProfileProvider);
        }
      } catch (e) {
        String errorMessage =
            'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করো।';
        if (e is AuthException) {
          if (e.message.contains('Email not confirmed')) {
            errorMessage =
                'দয়া করে তোমার ইমেইল চেক করো এবং ভেরিফাই লিংক এ ক্লিক করো।';
          }
        }
        throw Exception(errorMessage);
      }
    });
  }

  // ── Sign up ───────────────────────────────────────────────────────────────

  Future<void> signup({
    required String name,
    required String phone,
    required String gender,
    required String institute,
    required String stream,
    required String group,
    required String batch,
    String? examTarget,
    required String email,
    required String password,
    String? referralCode,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        final response = await _supabase.auth.signUp(
          email: email,
          password: password,
          data: {'full_name': name, 'name': name, 'role': 'Student'},
        );

        if (response.user != null) {
          await _supabase.from('users').upsert({
            'id': response.user?.id,
            'email': email,
            'name': name,
            'phone': phone,
            'gender': gender.isEmpty ? null : gender,
            'institute': institute,
            'stream': stream,
            'division': group,
            'batch': batch,
            'role': 'Student',
            'status': 'Active',
            'xp': 0,
            if (examTarget != null && examTarget.isNotEmpty)
              'exam_target': examTarget,
            'level': 'Beginner',
            'exams_taken': 0,
            'enrolled_exams': 0,
            'last_active': DateTime.now().toIso8601String(),
          });

          // Handle referral code if provided
          if (referralCode != null && referralCode.isNotEmpty) {
            try {
              // Lookup referral
              final referral = await _supabase
                  .from('referrals')
                  .select('*')
                  .eq('code', referralCode.trim().toUpperCase())
                  .maybeSingle();

              if (referral != null) {
                // Redeem via RPC
                await _supabase.rpc('redeem_referral_tx', params: {
                  'p_referral_id': referral['id'],
                  'p_redeemer_id': response.user!.id,
                });

                // Record history
                await _supabase.from('referral_history').insert({
                  'referral_id': referral['id'],
                  'redeemed_by': response.user!.id,
                  'redeemed_at': DateTime.now().toIso8601String(),
                  'admin_status': 'Pending',
                  'reward_given': false,
                });

                // Clear saved referral code
                final prefs = await SharedPreferences.getInstance();
                await prefs.remove('referralCode');
              }
            } catch (refErr) {
              debugPrint('[AuthController] Referral error: $refErr');
              // Proceed with signup even if referral fails
            }
          }
        }
      } catch (e) {
        throw Exception(
          e is AuthException ? e.message : 'Something went wrong',
        );
      }
    });
  }

  // ── Reset Password ────────────────────────────────────────────────────────

  Future<void> resetPassword(String email) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        await _supabase.auth.resetPasswordForEmail(
          email,
          redirectTo: 'io.supabase.obhyash://login-callback/', // Standard deep link pattern
        );
      } catch (e) {
        throw Exception(
          e is AuthException ? e.message : 'Something went wrong',
        );
      }
    });
  }

  Future<void> updatePassword(String newPassword) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        await _supabase.auth.updateUser(
          UserAttributes(password: newPassword),
        );
      } catch (e) {
        throw Exception(
          e is AuthException ? e.message : 'Something went wrong',
        );
      }
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  /// [forced] — true when triggered by the session monitor (another device login).
  Future<void> logout({bool forced = false}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final userId = _supabase.auth.currentUser?.id;

      // 1. Invalidate cached user profile state immediately
      ref.invalidate(userProfileProvider);

      // 2. Perform local signOut first so the in-memory session is cleared immediately
      // and onAuthStateChange(AuthChangeEvent.signedOut) fires with zero delay.
      try {
        await _supabase.auth.signOut(scope: SignOutScope.local);
      } catch (e) {
        debugPrint('[AuthController] Local signOut error: $e');
      }

      // 3. Clear local encrypted tokens in parallel
      await Future.wait([
        SecureStorageService.clearSession().catchError((_) {}),
        SecureStorageService.clearUserMeta().catchError((_) {}),
      ]);

      // 4. In the background (non-blocking), clean up session monitor & revoke server token
      if (userId != null) {
        unawaited(SessionMonitorService.stop(userId: userId));
      }
      unawaited(
        _supabase.auth
            .signOut(scope: SignOutScope.global)
            .timeout(const Duration(seconds: 3))
            .catchError((_) {}),
      );
    });
  }
}
