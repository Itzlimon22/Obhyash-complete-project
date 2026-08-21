import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/secure_storage_service.dart';
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
            await _handleSessionEstablished(session);
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
  Future<void> _handleSessionEstablished(Session session) async {
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

    // 2. Unregistered Google account check
    if (!isRegistered) {
      debugPrint('[AuthNotifier] ❌ Unregistered account ($email). Rejecting login and signing out.');
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

    // Keep secure storage up to date whenever tokens rotate
    final sessionId = '${session.user.id}:${session.accessToken.hashCode}';
    SecureStorageService.saveSession(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken ?? '',
      userId: session.user.id,
      sessionId: sessionId,
    );
  }

  /// Convenience sign-out that delegates to the controller.
  Future<void> signOut() async {
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
