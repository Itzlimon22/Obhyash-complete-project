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

  // ── Login (Email OR Mobile Number) ──────────────────────────────────────

  Future<void> login(String identifier, String password) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      String targetEmail = identifier.trim();
      final isEmail = targetEmail.contains('@');

      // Convert any Bengali numerals (০-৯) to English digits (0-9)
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      for (int i = 0; i < bnDigits.length; i++) {
        targetEmail = targetEmail.replaceAll(bnDigits[i], enDigits[i]);
      }

      // If identifier is a phone number
      if (!isEmail) {
        String cleanDigits = targetEmail.replaceAll(RegExp(r'\D'), '');
        if (cleanDigits.startsWith('8801') && cleanDigits.length == 13) {
          cleanDigits = cleanDigits.substring(2);
        } else if (cleanDigits.startsWith('1') && cleanDigits.length == 10) {
          cleanDigits = '0$cleanDigits';
        }

        String? resolvedEmail;

        // 1. Try secure RPC get_email_by_phone
        try {
          final res = await _supabase.rpc('get_email_by_phone', params: {
            'p_phone': cleanDigits,
          });
          if (res != null && res.toString().trim().isNotEmpty) {
            resolvedEmail = res.toString().trim();
          }
        } catch (rpcErr) {
          debugPrint('[AuthController] get_email_by_phone RPC failed: $rpcErr');
        }

        // 2. Fallback direct table query
        if (resolvedEmail == null || resolvedEmail.isEmpty) {
          try {
            final userRow = await _supabase
                .from('users')
                .select('email')
                .or('phone.eq.$cleanDigits,phone.eq.+88$cleanDigits,phone.eq.88$cleanDigits')
                .maybeSingle();
            if (userRow != null && userRow['email'] != null) {
              resolvedEmail = userRow['email'].toString().trim();
            }
          } catch (tableErr) {
            debugPrint('[AuthController] users table phone query error: $tableErr');
          }
        }

        if (resolvedEmail == null || resolvedEmail.isEmpty) {
          throw Exception('এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
        }
        targetEmail = resolvedEmail;
      }

      try {
        final response = await _supabase.auth.signInWithPassword(
          email: targetEmail,
          password: password,
        );

        final session = response.session;
        final user = response.user;

        if (session != null && user != null) {
          final sessionId = '${user.id}:${session.accessToken.hashCode}';

          // Persist tokens in background (non-blocking)
          unawaited(
            SecureStorageService.saveSession(
              accessToken: session.accessToken,
              refreshToken: session.refreshToken ?? '',
              userId: user.id,
              sessionId: sessionId,
            ),
          );

          unawaited(
            SecureStorageService.saveUserMeta({
              'name': user.userMetadata?['full_name'] ?? '',
              'email': user.email ?? '',
            }),
          );

          try {
            unawaited(
              _supabase.from('users').upsert({
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
              }, onConflict: 'id'),
            );
          } catch (upsertErr) {
            debugPrint(
              '[AuthController] users row upsert error (non-fatal): $upsertErr',
            );
          }

          try {
            unawaited(
              SessionMonitorService.start(
                userId: user.id,
                onForcedSignOut: () async => logout(forced: true),
              ),
            );
          } catch (_) {}

          ref.invalidate(userProfileProvider);
        }
      } on AuthException catch (e) {
        if (e.message.contains('Email not confirmed')) {
          throw Exception('দয়া করে তোমার ইমেইল চেক করো এবং ভেরিফাই লিংক এ ক্লিক করো।');
        } else if (e.message.contains('Invalid login credentials') ||
            e.message.contains('invalid_grant')) {
          throw Exception(isEmail
              ? 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।'
              : 'মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।');
        }
        throw Exception(e.message);
      } catch (e) {
        final str = e.toString();
        if (str.contains('এই মোবাইল নম্বর')) {
          throw Exception('এই মোবাইল নম্বর দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
        }
        throw Exception(str.startsWith('Exception: ') ? str.substring(11) : str);
      }
    });
  }

  // ── Google Sign-in (Account-linking Safe) ─────────────────────────────────

  Future<void> loginWithGoogle() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      try {
        await _supabase.auth.signInWithOAuth(
          OAuthProvider.google,
          redirectTo: 'io.supabase.obhyash://login-callback/',
        );
      } catch (e) {
        debugPrint('[AuthController] Google login error: $e');
        throw Exception(e is AuthException ? e.message : 'গুগল লগইন ব্যর্থ হয়েছে।');
      }
    });
  }

  // ── OTP Phone Verification (Registration Only) ──────────────────────────

  Future<Map<String, dynamic>> sendRegistrationOtp(String phone) async {
    try {
      final isDev = kDebugMode;
      final res = await _supabase.rpc('send_registration_otp', params: {
        'p_phone': phone.trim(),
        'p_is_dev_mock': isDev,
      });

      if (res is Map<String, dynamic>) {
        if (isDev && res['otp_code'] != null) {
          debugPrint('========================================');
          debugPrint('[DEV OTP MOCK] Phone: ${res['phone']} | Code: ${res['otp_code']}');
          debugPrint('========================================');
        }
        return res;
      }
      return {'success': false, 'error': 'ওটিপি রেসপন্স ত্রুটিপূর্ণ'};
    } catch (e) {
      debugPrint('[AuthController] sendRegistrationOtp error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> verifyRegistrationOtp(String phone, String otp) async {
    try {
      final res = await _supabase.rpc('verify_registration_otp', params: {
        'p_phone': phone.trim(),
        'p_otp': otp.trim(),
      });

      if (res is Map<String, dynamic>) {
        return res;
      }
      return {'success': false, 'error': 'যাচাইকরণ রেসপন্স ত্রুটিপূর্ণ'};
    } catch (e) {
      debugPrint('[AuthController] verifyRegistrationOtp error: $e');
      return {'success': false, 'error': e.toString()};
    }
  }

  // ── Sign up ───────────────────────────────────────────────────────────────

  Future<void> signup({
    required String name,
    required String phone,
    String? gender,
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
            if (gender != null && gender.isNotEmpty) 'gender': gender,
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
