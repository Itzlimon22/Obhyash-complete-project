import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// Equivalent to `useAuth` in React
// This provider holds the current user state and handles listening to auth changes
final authProvider = NotifierProvider<AuthNotifier, User?>(
  () => AuthNotifier(),
);

class AuthNotifier extends Notifier<User?> {
  @override
  User? build() {
    _initializeAuth();
    return Supabase.instance.client.auth.currentUser;
  }

  void _initializeAuth() {
    // Listen to Supabase auth state changes natively over WebSockets
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;

      if (event == AuthChangeEvent.signedIn ||
          event == AuthChangeEvent.tokenRefreshed) {
        state = session?.user;
      } else if (event == AuthChangeEvent.signedOut ||
          event == AuthChangeEvent.userDeleted) {
        state = null;
      }
    });
  }

  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
  }
}
