import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../router.dart';
import '../utils/app_popups.dart';

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

    // 1. Handle OAuth errors returning from deep link
    final error = uri.queryParameters['error'] ??
        (uri.fragment.contains('error=')
            ? RegExp(r'error=([^&]+)').firstMatch(uri.fragment)?.group(1)
            : null);

    if (error != null) {
      debugPrint('[DeepLinkService] Deep link error: $error');
      final desc = uri.queryParameters['error_description'] ??
          (uri.fragment.contains('error_description=')
              ? RegExp(r'error_description=([^&]+)')
                  .firstMatch(uri.fragment)
                  ?.group(1)
              : null);

      final ctx = rootNavigatorKey.currentContext;
      if (ctx != null && ctx.mounted) {
        if (error == 'unregistered_google') {
          AppPopups.error(
            ctx,
            message:
                'এই গুগল ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। দয়া করে আগে নতুন অ্যাকাউন্ট খুলুন।',
            duration: const Duration(seconds: 4),
          );
        } else if (error != 'oauth_cancelled') {
          AppPopups.error(
            ctx,
            message: desc != null ? Uri.decodeComponent(desc) : 'গুগল লগইন সম্পন্ন করা যায়নি।',
            duration: const Duration(seconds: 4),
          );
        }
      }
      final session = Supabase.instance.client.auth.currentSession;
      if (session == null) {
        router.go('/login');
      }
      return;
    }

    // 2. Handle Referral Deep Links (e.g. obhyash://ref?code=ABCDEF or https://obhyash.com/signup?ref=ABCDEF)
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
