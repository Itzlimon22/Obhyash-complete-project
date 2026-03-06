import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/secure_storage_service.dart';

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
    //    This is non-null when the Supabase SDK has already restored its
    //    session from its own internal storage on startup.
    final current = Supabase.instance.client.auth.currentUser;

    // 2. Listen for future auth events (login, token refresh, sign-out).
    _initializeAuth();

    return current;
  }

  void _initializeAuth() {
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      switch (event) {
        case AuthChangeEvent.signedIn:
        case AuthChangeEvent.tokenRefreshed:
        case AuthChangeEvent.initialSession:
          state = session?.user;

          // Keep secure storage up to date whenever tokens rotate
          if (session != null) {
            final sessionId =
                '${session.user.id}:${session.accessToken.hashCode}';
            SecureStorageService.saveSession(
              accessToken: session.accessToken,
              refreshToken: session.refreshToken ?? '',
              userId: session.user.id,
              sessionId: sessionId,
            );
          }

        case AuthChangeEvent.signedOut:
        case AuthChangeEvent.userDeleted:
          state = null;

        default:
          break;
      }
    });
  }

  /// Convenience sign-out that delegates to the controller.
  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
    // SecureStorageService.clearSession() is handled by AuthController.logout()
  }
}
