import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  void init(GoRouter router) {
    _appLinks = AppLinks();
    
    // Check initial link if app was in cold state (terminated)
    _checkInitialLink(router);

    // Handle link when app is in warm state (front or background)
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      _handleDeepLink(uri, router);
    }, onError: (err) {
      debugPrint('[DeepLinkService] error: $err');
    });
  }

  Future<void> _checkInitialLink(GoRouter router) async {
    try {
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _handleDeepLink(initialUri, router);
      }
    } catch (e) {
      debugPrint('[DeepLinkService] initial link error: $e');
    }
  }

  Future<void> _handleDeepLink(Uri uri, GoRouter router) async {
    debugPrint('[DeepLinkService] Received deep link: $uri');
    
    // Example: https://obhyash.com/signup?ref=ABCDEF
    // Example: obhyash://ref?code=ABCDEF
    
    String? referralCode;
    
    if (uri.queryParameters.containsKey('ref')) {
      referralCode = uri.queryParameters['ref'];
    } else if (uri.queryParameters.containsKey('code')) {
      referralCode = uri.queryParameters['code'];
    }

    if (referralCode != null && referralCode.isNotEmpty) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('referralCode', referralCode.trim());
      
      final session = Supabase.instance.client.auth.currentSession;
      if (session == null) {
        router.go('/signup');
      }
    }
  }

  void dispose() {
    _linkSubscription?.cancel();
  }
}
