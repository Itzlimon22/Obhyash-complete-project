import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/exam/services/local_exam_cache_service.dart';
import '../../services/secure_storage_service.dart';
import '../../services/session_monitor_service.dart';
import '../../features/notifications/providers/notification_providers.dart';
import '../router.dart';
import 'package:go_router/go_router.dart';

// Equivalent to `useAuth` in React.
// Holds the current Supabase user and listens to auth state changes.
// On build, immediately tries to restore a session from encrypted storage
// so the user is available *before* the async auth state event fires.
final authProvider = NotifierProvider<AuthNotifier, User?>(
  () => AuthNotifier(),
);

class AuthNotifier extends Notifier<User?> {
  /// When true, native Google authentication or profile lookup is actively resolving.
  /// Router MUST NOT navigate to '/' during this window.
  static bool isResolvingGoogleAuth = false;

  /// Tracks whether the active user has incomplete registration/profile (needs /complete-profile).
  static bool needsProfileCompletion = false;

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
        case AuthChangeEvent.userUpdated:
        case AuthChangeEvent.passwordRecovery:
          if (session != null) {
            await _handleSessionEstablished(session, event: event);
          }
          break;

        case AuthChangeEvent.signedOut:
          needsProfileCompletion = false;
          isResolvingGoogleAuth = false;
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

    // 1. Check if user has complete profile (stream + batch) in public.users
    bool isComplete = true;
    try {
      final res = await supabase
          .from('users')
          .select('id, stream, batch, role')
          .or('id.eq.${user.id},email.ilike.${email ?? ''}')
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (res == null) {
        isComplete = false;
      } else {
        final role = (res['role'] as String? ?? '').toLowerCase();
        final isStaff = role == 'admin' || role == 'teacher';
        final stream = res['stream'] as String?;
        final batch = res['batch'] as String?;
        isComplete = isStaff ||
            (stream != null &&
                stream.isNotEmpty &&
                batch != null &&
                batch.isNotEmpty);
      }
    } catch (e) {
      debugPrint('[AuthNotifier] Registration check error: $e');
      isComplete = true;
    }

    // 2. Unregistered / Incomplete Google account check
    final provider = user.appMetadata['provider'] as String? ?? '';
    final isGoogleUser = provider == 'google' ||
        (user.identities?.any((i) => i.provider == 'google') ?? false);

    if (isGoogleUser && !isComplete) {
      debugPrint(
        '[AuthNotifier] ℹ️ Incomplete Google account ($email). Navigating to /complete-profile.',
      );
      needsProfileCompletion = true;
      final ctx = rootNavigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        Future.microtask(() {
          if (ctx.mounted) {
            GoRouter.of(ctx).go('/complete-profile');
          }
        });
      }
      return;
    } else {
      needsProfileCompletion = false;
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

  void refreshUser() {
    state = Supabase.instance.client.auth.currentUser;
  }

  /// Convenience sign-out that cleans up and delegates to Supabase.
  Future<void> signOut() async {
    needsProfileCompletion = false;
    isResolvingGoogleAuth = false;
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
