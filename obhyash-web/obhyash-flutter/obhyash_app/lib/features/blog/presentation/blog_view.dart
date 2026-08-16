import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

class BlogView extends StatefulWidget {
  const BlogView({super.key});

  @override
  State<BlogView> createState() => _BlogViewState();
}

class _BlogViewState extends State<BlogView> {
  late final WebViewController _controller;
  int _loadingProgress = 0;
  String _pageTitle = 'অভ্যাস ব্লগ';
  String _currentUrl = 'https://obhyash.vercel.app/blog';
  bool _canGoBack = false;

  static const _baseBlogUrl = 'https://obhyash.vercel.app/blog';
  static const _projectRef = 'ufeepgzheopyaefuyegg';
  static const _authCookieKey = 'sb-$_projectRef-auth-token';

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  Future<void> _initWebView() async {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.transparent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) {
              setState(() => _loadingProgress = progress);
            }
          },
          onPageStarted: (url) async {
            if (mounted) {
              setState(() {
                _loadingProgress = 15;
                _currentUrl = url;
              });
            }
            // Inject auth session right as page begins loading
            await _syncAuthToWebView();
          },
          onPageFinished: (url) async {
            final title = await _controller.getTitle();
            final canGoBack = await _controller.canGoBack();

            // Sync auth session & inject UI cleaning styles
            await _syncAuthToWebView();
            await _injectNativeCleaningStyles();

            if (mounted) {
              setState(() {
                _loadingProgress = 100;
                _canGoBack = canGoBack;
                _currentUrl = url;

                // Format clean title
                if (title != null && title.isNotEmpty) {
                  _pageTitle = title
                      .replaceAll(' | Obhyash Blog', '')
                      .replaceAll(' - Obhyash Blog', '')
                      .trim();
                } else {
                  _pageTitle = 'অভ্যাস ব্লগ';
                }
              });
            }
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri == null) return NavigationDecision.prevent;

            // If user clicked "ড্যাশবোর্ড" or home page inside web, return to app dashboard
            if (uri.path == '/' || uri.path.isEmpty) {
              if (mounted) {
                _closeOrGoHome();
              }
              return NavigationDecision.prevent;
            }

            // Keep navigation inside WebView for blog routes
            if (request.url.contains('/blog')) {
              return NavigationDecision.navigate;
            }

            // Open external links outside the app
            launchUrl(
              Uri.parse(request.url),
              mode: LaunchMode.externalApplication,
            );
            return NavigationDecision.prevent;
          },
        ),
      );

    // Pre-populate WebView cookies with active Supabase session
    await _setupAuthCookies();

    final session = Supabase.instance.client.auth.currentSession;
    final headers = <String, String>{};
    final startUri = Uri.parse(_baseBlogUrl);

    if (session != null && session.accessToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${session.accessToken}';
    }

    await _controller.loadRequest(
      startUri,
      headers: headers,
    );
  }

  /// Sets up Supabase SSR session cookies on all relevant domains
  Future<void> _setupAuthCookies() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null || session.accessToken.isEmpty) return;

    try {
      final cookieManager = WebViewCookieManager();
      final domains = [
        'obhyash.vercel.app',
        '.vercel.app',
        'obhyash.com',
        '.obhyash.com'
      ];

      final rawList = [
        session.accessToken,
        session.refreshToken ?? '',
        null,
        null,
        null,
      ];
      final jsonRaw = jsonEncode(rawList);
      final base64Val = 'base64-${base64Url.encode(utf8.encode(jsonRaw)).replaceAll('=', '')}';

      for (final domain in domains) {
        // Base64 chunked and direct cookies for @supabase/ssr compatibility
        await cookieManager.setCookie(
          WebViewCookie(
            name: _authCookieKey,
            value: base64Val,
            domain: domain,
            path: '/',
          ),
        );
        await cookieManager.setCookie(
          WebViewCookie(
            name: '$_authCookieKey.0',
            value: base64Val,
            domain: domain,
            path: '/',
          ),
        );
      }
    } catch (e) {
      debugPrint('[BlogView] Error setting up auth cookies: $e');
    }
  }

  /// Injects session tokens into WebView's localStorage, cookies, and fetch interceptor
  Future<void> _syncAuthToWebView() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null || session.accessToken.isEmpty) return;

    final userJson = jsonEncode(session.user.toJson());
    final accessToken = session.accessToken;
    final refreshToken = session.refreshToken ?? '';
    final expiresAt = session.expiresAt ??
        (DateTime.now().millisecondsSinceEpoch ~/ 1000 + 3600);

    final jsAuthCode = '''
      (function() {
        try {
          const accessToken = "$accessToken";
          const refreshToken = "$refreshToken";
          const storageKey = "$_authCookieKey";

          // 1. Supabase LocalStorage session
          const sessionObj = {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "bearer",
            expires_in: 3600,
            expires_at: $expiresAt,
            user: $userJson
          };
          localStorage.setItem(storageKey, JSON.stringify(sessionObj));

          // 2. Cache user profile for AuthProvider instant resolution
          localStorage.setItem("obhyash_user_profile", JSON.stringify({
            id: "${session.user.id}",
            email: "${session.user.email ?? ''}",
            name: "${session.user.userMetadata?['name'] ?? session.user.userMetadata?['full_name'] ?? 'User'}",
            role: "student"
          }));

          // 3. Browser document.cookie in proper base64url format for SSR API endpoints
          const rawArr = JSON.stringify([accessToken, refreshToken, null, null, null]);
          const b64 = 'base64-' + btoa(unescape(encodeURIComponent(rawArr)))
            .replace(/\\+/g, '-')
            .replace(/\\//g, '_')
            .replace(/=+\$/, '');
          const cookieFlags = '; path=/; max-age=31536000; SameSite=Lax';

          document.cookie = storageKey + '=' + b64 + cookieFlags;
          document.cookie = storageKey + '.0=' + b64 + cookieFlags;

          // 4. Intercept fetch to guarantee Authorization header is attached to all API calls
          if (!window._obhyashAuthHooked) {
            window._obhyashAuthHooked = true;
            window._obhyashToken = accessToken;
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
              options = options || {};
              const token = window._obhyashToken || accessToken;
              if (token) {
                if (options.headers instanceof Headers) {
                  if (!options.headers.has('Authorization')) {
                    options.headers.set('Authorization', 'Bearer ' + token);
                  }
                } else if (Array.isArray(options.headers)) {
                  options.headers.push(['Authorization', 'Bearer ' + token]);
                } else {
                  options.headers = options.headers || {};
                  if (!options.headers['Authorization'] && !options.headers['authorization']) {
                    options.headers['Authorization'] = 'Bearer ' + token;
                  }
                }
              }
              return originalFetch.call(this, url, options);
            };
          } else {
            window._obhyashToken = accessToken;
          }

          window._obhyashToken = accessToken;
          window._obhyashUser = sessionObj.user;

          // 5. Inform Supabase JS & trigger storage events
          if (window.supabase && window.supabase.auth) {
            window.supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            }).catch(() => {});
          }
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('obhyash:auth_ready', { detail: { token: accessToken, user: sessionObj.user } }));
        } catch (err) {
          console.error('[ObhyashApp] Auth Sync Error:', err);
        }
      })();
    ''';

    try {
      await _controller.runJavaScript(jsAuthCode);
    } catch (_) {}
  }

  Future<void> _injectNativeCleaningStyles() async {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final jsCode = '''
      (function() {
        // Sync theme
        if (${isDark ? 'true' : 'false'}) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // 1. Inject permanent CSS rule into head for flicker-free hiding
        let styleTag = document.getElementById('obhyash-inapp-clean-style');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'obhyash-inapp-clean-style';
          styleTag.innerHTML = `
            header,
            [class*="BlogHeader"],
            nav,
            header.sticky,
            footer,
            [class*="BlogFooter"],
            #blog-cta-banner,
            section:has(#blog-cta-banner),
            section:has(a[href="/"]):has(h2) {
              display: none !important;
            }
            .sticky.top-16,
            [class*="sticky"][class*="top-16"],
            #blog-category-sticky-bar {
              top: 0px !important;
            }
            main {
              padding-top: 0px !important;
              padding-bottom: 32px !important;
            }
          `;
          if (document.head) {
            document.head.appendChild(styleTag);
          }
        }

        // 2. Hide elements directly on DOM nodes and adjust sticky elements
        const hideElements = () => {
          const selectors = [
            'header',
            '[class*="BlogHeader"]',
            'nav',
            'header.sticky',
            'footer',
            '[class*="BlogFooter"]',
            '#blog-cta-banner',
            'section:has(a[href="/"]):has(h2)'
          ];
          selectors.forEach(selector => {
            try {
              document.querySelectorAll(selector).forEach(el => {
                el.style.setProperty('display', 'none', 'important');
              });
            } catch (_) {}
          });

          // Ensure category bar sticks flush to top: 0px (no floating gap)
          try {
            document.querySelectorAll('.sticky, [class*="sticky"], #blog-category-sticky-bar').forEach(el => {
              if (el.id === 'blog-category-sticky-bar' || el.className.includes('top-16')) {
                el.style.setProperty('top', '0px', 'important');
              }
            });
          } catch (_) {}

          // Adjust main padding to sit cleanly under native app bar
          const main = document.querySelector('main');
          if (main) {
            main.style.paddingTop = '12px';
            main.style.paddingBottom = '32px';
          }
        };

        hideElements();
        // Repeat on dynamic DOM updates
        const observer = new MutationObserver(hideElements);
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      })();
    ''';

    try {
      await _controller.runJavaScript(jsCode);
    } catch (_) {}
  }

  void _closeOrGoHome() {
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  Future<bool> _handleBackPress() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLoading = _loadingProgress > 0 && _loadingProgress < 100;

    return PopScope(
      canPop: !_canGoBack,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _handleBackPress();
        if (shouldPop) {
          _closeOrGoHome();
        }
      },
      child: Scaffold(
        backgroundColor: isDark
            ? const Color(0xFF0C0A09)
            : const Color(0xFFFAF6F3), // Matches blog web background
        appBar: AppBar(
          backgroundColor: isDark
              ? const Color(0xFF0C0A09).withValues(alpha: 0.95)
              : Colors.white.withValues(alpha: 0.95),
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          leading: IconButton(
            icon: Icon(
              LucideIcons.chevronLeft,
              color: isDark ? Colors.white : const Color(0xFF111827),
              size: 22,
            ),
            tooltip: 'পেছনে',
            onPressed: () async {
              final shouldPop = await _handleBackPress();
              if (shouldPop) {
                _closeOrGoHome();
              }
            },
          ),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _pageTitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: 'Anek Bangla',
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
              ),
              if (_currentUrl != _baseBlogUrl)
                Text(
                  'Obhyash Blog',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? const Color(0xFF737373)
                        : const Color(0xFF6B7280),
                  ),
                ),
            ],
          ),
          actions: [
            // Refresh / Reload Button
            IconButton(
              icon: Icon(
                isLoading ? LucideIcons.x : LucideIcons.rotateCw,
                size: 19,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF4B5563),
              ),
              tooltip: isLoading ? 'বাতিল' : 'রিফ্রেশ',
              onPressed: () {
                if (isLoading) {
                  _controller.loadRequest(Uri.parse(_baseBlogUrl));
                } else {
                  _controller.reload();
                }
              },
            ),
            // Open in external browser
            IconButton(
              icon: Icon(
                LucideIcons.externalLink,
                size: 19,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF4B5563),
              ),
              tooltip: 'ব্রাউজারে খুলুন',
              onPressed: () => launchUrl(
                Uri.parse(_currentUrl),
                mode: LaunchMode.externalApplication,
              ),
            ),
            const SizedBox(width: 4),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(2),
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 200),
              opacity: isLoading ? 1.0 : 0.0,
              child: LinearProgressIndicator(
                value: isLoading ? (_loadingProgress / 100) : 1.0,
                minHeight: 2,
                backgroundColor: Colors.transparent,
                valueColor: const AlwaysStoppedAnimation<Color>(
                  Color(0xFF059669), // emerald-600
                ),
              ),
            ),
          ),
        ),
        body: WebViewWidget(controller: _controller),
      ),
    );
  }
}
