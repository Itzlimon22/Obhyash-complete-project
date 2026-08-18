import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/providers/theme_provider.dart';

class BlogView extends ConsumerStatefulWidget {
  const BlogView({super.key});

  @override
  ConsumerState<BlogView> createState() => _BlogViewState();
}

class _BlogViewState extends ConsumerState<BlogView> {
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

                // Format clean title in Bengali
                if (title != null &&
                    title.isNotEmpty &&
                    !title.toLowerCase().contains('obhyash blog') &&
                    !title.contains('অভ্যাস ব্লগ')) {
                  _pageTitle = title
                      .replaceAll(' | Obhyash Blog', '')
                      .replaceAll(' - Obhyash Blog', '')
                      .replaceAll('Obhyash Blog', '')
                      .trim();
                  if (_pageTitle.isEmpty) _pageTitle = 'অভ্যাস ব্লগ';
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

  /// Injects official Supabase auth cookies onto the target domain so SSR/Middleware authenticates seamlessly
  Future<void> _setupAuthCookies() async {
    try {
      final session = Supabase.instance.client.auth.currentSession;
      if (session == null) return;

      final cookieManager = WebViewCookieManager();
      final uri = Uri.parse(_baseBlogUrl);
      final domain = uri.host;

      final sessionData = [
        session.accessToken,
        session.refreshToken ?? '',
        session.user.id,
        session.tokenType,
      ];
      final cookieValue = 'base64-${base64Url.encode(utf8.encode(jsonEncode(sessionData)))}';

      await cookieManager.setCookie(
        WebViewCookie(
          name: _authCookieKey,
          value: cookieValue,
          domain: domain,
          path: '/',
        ),
      );

      // Also set standard access_token cookie
      await cookieManager.setCookie(
        WebViewCookie(
          name: 'sb-access-token',
          value: session.accessToken,
          domain: domain,
          path: '/',
        ),
      );
    } catch (e) {
      debugPrint('[BlogView] Error setting auth cookies: $e');
    }
  }

  /// Injects active auth token & user data into WebView window and intercept Fetch requests
  Future<void> _syncAuthToWebView() async {
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    final accessToken = session.accessToken;
    final refreshToken = session.refreshToken ?? '';
    final userJson = jsonEncode(session.user.toJson());

    final sessionObjJson = jsonEncode({
      'access_token': accessToken,
      'refresh_token': refreshToken,
      'expires_in': session.expiresIn ?? 3600,
      'token_type': session.tokenType,
      'user': session.user.toJson(),
    });

    final jsAuthCode = '''
      (function() {
        try {
          const accessToken = '$accessToken';
          const refreshToken = '$refreshToken';
          const userObj = $userJson;
          const sessionObj = $sessionObjJson;
          const cookieKey = '$_authCookieKey';

          // 1. Write Supabase Auth session token to localStorage
          localStorage.setItem(cookieKey, JSON.stringify(sessionObj));
          localStorage.setItem('supabase.auth.token', JSON.stringify(sessionObj));
          localStorage.setItem('sb-access-token', accessToken);

          // 2. Set Cookies directly via document.cookie for immediate availability
          const domain = window.location.hostname;
          const maxAge = 60 * 60 * 24 * 7; // 7 days
          
          const sessionData = [
            accessToken,
            refreshToken,
            userObj.id,
            sessionObj.token_type || 'bearer'
          ];
          const b64Val = 'base64-' + btoa(JSON.stringify(sessionData));
          
          document.cookie = cookieKey + '=' + b64Val + '; path=/; domain=' + domain + '; max-age=' + maxAge + '; SameSite=Lax';
          document.cookie = 'sb-access-token=' + accessToken + '; path=/; domain=' + domain + '; max-age=' + maxAge + '; SameSite=Lax';

          // 3. Inject Bearer token in dynamic fetch requests to Obhyash APIs
          if (!window._obhyashFetchHooked) {
            window._obhyashFetchHooked = true;
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
              if (typeof url === 'string' && (url.startsWith('/api') || url.includes(domain))) {
                options.headers = options.headers || {};
                if (options.headers instanceof Headers) {
                  if (!options.headers.has('Authorization')) {
                    options.headers.set('Authorization', 'Bearer ' + accessToken);
                  }
                } else if (Array.isArray(options.headers)) {
                  const hasAuth = options.headers.some(([k]) => k.toLowerCase() === 'authorization');
                  if (!hasAuth) {
                    options.headers.push(['Authorization', 'Bearer ' + accessToken]);
                  }
                } else {
                  if (!options.headers['Authorization'] && !options.headers['authorization']) {
                    options.headers['Authorization'] = 'Bearer ' + accessToken;
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

          // 4. Inform Supabase JS & trigger storage events
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
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
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
            'footer',
            '[class*="BlogFooter"]',
            '#blog-cta-banner'
          ];
          selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
              el.style.setProperty('display', 'none', 'important');
            });
          });

          // Adjust sticky bars
          const stickyBar = document.getElementById('blog-category-sticky-bar') ||
                            document.querySelector('.sticky.top-16');
          if (stickyBar) {
            stickyBar.style.setProperty('top', '0px', 'important');
          }
        };

        hideElements();
        setTimeout(hideElements, 100);
        setTimeout(hideElements, 500);
        setTimeout(hideElements, 1500);

        // 3. Intercept dynamic category filter clicks & internal blog links
        document.querySelectorAll('a[href^="/blog"]').forEach(link => {
          if (!link._obhyashBound) {
            link._obhyashBound = true;
            link.addEventListener('click', function(e) {
              const target = this.getAttribute('href');
              if (target && target.startsWith('/blog')) {
                // Keep smooth in-app navigation
              }
            });
          }
        });
      })();
    ''';

    try {
      await _controller.runJavaScript(jsCode);
    } catch (_) {}
  }

  void _closeOrGoHome() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/');
    }
  }

  Future<bool> _handleBackPress() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false; // Handled by WebView
    }
    return true; // Pop screen
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLoading = _loadingProgress < 100;

    return PopScope(
      canPop: !_canGoBack,
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop) {
          final shouldPop = await _handleBackPress();
          if (shouldPop && mounted) {
            _closeOrGoHome();
          }
        }
      },
      child: Scaffold(
        backgroundColor: isDark
            ? const Color(0xFF0C0A09) // Matches blog dark background
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
                  fontFamily: 'HindSiliguri',
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
              ),
              if (_currentUrl != _baseBlogUrl)
                Text(
                  'অভ্যাস ব্লগ',
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? const Color(0xFF9CA3AF)
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
            // Theme Toggle Button (Replaced external browser button)
            IconButton(
              icon: Icon(
                isDark ? LucideIcons.sun : LucideIcons.moon,
                size: 20,
                color: isDark
                    ? const Color(0xFFFBBF24)
                    : const Color(0xFF4B5563),
              ),
              tooltip: isDark ? 'লাইট মোড' : 'ডার্ক মোড',
              onPressed: () {
                ref.read(themeModeProvider.notifier).toggle();
                final nextDark = !isDark;
                _controller.runJavaScript('''
                  if ($nextDark) {
                    document.documentElement.classList.add('dark');
                    document.body.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.body.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                  }
                ''');
              },
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
