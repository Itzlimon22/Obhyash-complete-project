import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/exam/services/local_exam_cache_service.dart';
import '../../services/secure_storage_service.dart';
import '../../services/session_monitor_service.dart';
import '../../features/notifications/providers/notification_providers.dart';
import '../router.dart';
import '../utils/app_popups.dart';

// Equivalent to `useAuth` in React.
// Holds the current Supabase user and listens to auth state changes.
// On build, immediately tries to restore a session from encrypted storage
// so the user is available *before* the async auth state event fires.
final authProvider = NotifierProvider<AuthNotifier, User?>(
  () => AuthNotifier(),
);

class AuthNotifier extends Notifier<User?> {
  @override
  User? build() {
    // 1. Serve the currently-known user synchronously (fastest path).
    final current = Supabase.instance.client.auth.currentUser;

    // 2. Listen for future auth events (login, token refresh, sign-out).
    _initializeAuth();

    return current;
  }

  void _initializeAuth() {
    Supabase.instance.client.auth.onAuthStateChange.listen((data) async {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      switch (event) {
        case AuthChangeEvent.signedIn:
        case AuthChangeEvent.initialSession:
        case AuthChangeEvent.tokenRefreshed:
          if (session != null) {
            await _handleSessionEstablished(session, event: event);
          }
          break;

        case AuthChangeEvent.signedOut:
          state = null;
          break;

        default:
          break;
      }
    });
  }

  /// Verifies that the authenticated session corresponds to an existing registered user.
  /// If the account does not match any registered student, it immediately rejects the login,
  /// signs out, returns to the login screen, and shows a descriptive toast message.
  Future<void> _handleSessionEstablished(
    Session session, {
    AuthChangeEvent? event,
  }) async {
    final user = session.user;
    final email = user.email?.trim();
    final supabase = Supabase.instance.client;

    // 1. Check if user is registered in public.users
    bool isRegistered = true;
    try {
      final rpcRes = await supabase.rpc('check_user_registered', params: {
        'p_user_id': user.id,
        'p_email': email,
      });

      if (rpcRes is bool) {
        isRegistered = rpcRes;
      } else {
        // Fallback: direct table check
        final res = await supabase
            .from('users')
            .select('id')
            .or('id.eq.${user.id},email.ilike.${email ?? ''}')
            .maybeSingle();
        isRegistered = res != null;
      }
    } catch (e) {
      debugPrint('[AuthNotifier] Registration check error: $e');
      // Direct table check fallback
      try {
        final res = await supabase
            .from('users')
            .select('id')
            .or('id.eq.${user.id},email.ilike.${email ?? ''}')
            .maybeSingle();
        isRegistered = res != null;
      } catch (_) {
        // In case of offline cache or RLS, preserve session
        isRegistered = true;
      }
    }

    // 2. Unregistered Google account check (Only applies to Google OAuth logins)
    final provider = user.appMetadata['provider'] as String? ?? '';
    final isGoogleUser = provider == 'google' ||
        (user.identities?.any((i) => i.provider == 'google') ?? false);

    if (isGoogleUser && !isRegistered) {
      debugPrint('[AuthNotifier] ❌ Unregistered Google account ($email). Rejecting login and signing out.');
      state = null;
      try {
        await supabase.auth.signOut(scope: SignOutScope.local);
      } catch (_) {}

      // Display proper error toast to user on Login Screen
      final ctx = rootNavigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        AppPopups.error(
          ctx,
          message: 'এই গুগল ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে আগে নতুন অ্যাকাউন্ট খুলুন।',
          duration: const Duration(seconds: 4),
        );
      }
      return;
    }

    // 3. User is registered! Sync Google OAuth user profile if needed
    if (email != null && email.isNotEmpty) {
      supabase.rpc('sync_google_login_user', params: {
        'p_auth_id': user.id,
        'p_email': email,
      }).catchError((err) {
        debugPrint('[AuthNotifier] sync_google_login_user error: $err');
      });
    }

    state = session.user;

    // 4. Single Device Session Lock:
    // On fresh login, generate a new unique session and set it in DB.
    // Previous devices will receive the Realtime event and auto-logout silently.
    var sessionId = await SecureStorageService.getSessionId();
    final isFreshLogin = event == AuthChangeEvent.signedIn || sessionId == null || sessionId.isEmpty;
    if (isFreshLogin) {
      sessionId = SessionMonitorService.generateSessionId(session.user.id);
      await SessionMonitorService.registerActiveSession(session.user.id, sessionId);
    }

    // Keep secure storage up to date whenever tokens rotate
    await SecureStorageService.saveSession(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? '',
      userId: session.user.id,
      sessionId: sessionId,
    );

    // 5. Start Realtime Single Device Monitor
    unawaited(
      SessionMonitorService.start(
        userId: session.user.id,
        isFreshLogin: isFreshLogin,
        onForcedSignOut: () async {
          debugPrint('[AuthNotifier] Newer session on another device. Silent auto-logout.');
          await signOut();
        },
      ),
    );
  }

  /// Convenience sign-out that cleans up and delegates to Supabase.
  Future<void> signOut() async {
    final uid = state?.id ?? Supabase.instance.client.auth.currentUser?.id;
    if (uid != null) {
      unawaited(SessionMonitorService.stop(userId: uid));
    }
    state = null;
    ref.invalidate(notificationsProvider);
    await Future.wait([
      SecureStorageService.clearSession().catchError((_) {}),
      SecureStorageService.clearUserMeta().catchError((_) {}),
      LocalExamCacheService.clearAll().catchError((_) {}),
    ]);
    try {
      await Supabase.instance.client.auth.signOut(scope: SignOutScope.local);
    } catch (_) {}
    unawaited(
      Supabase.instance.client.auth
          .signOut(scope: SignOutScope.global)
          .timeout(const Duration(seconds: 3))
          .catchError((_) {}),
    );
  }
}
