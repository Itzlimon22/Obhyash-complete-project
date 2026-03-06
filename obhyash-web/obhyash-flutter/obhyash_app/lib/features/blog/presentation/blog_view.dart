import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
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
  String _pageTitle = 'ব্লগ';
  bool _canGoBack = false;

  static const _blogUrl = 'https://obhyash.vercel.app/blog';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _loadingProgress = progress);
          },
          onPageStarted: (_) {
            if (mounted) setState(() => _loadingProgress = 0);
          },
          onPageFinished: (url) async {
            final title = await _controller.getTitle();
            final canGoBack = await _controller.canGoBack();
            if (mounted) {
              setState(() {
                _pageTitle = (title != null && title.isNotEmpty)
                    ? title
                    : 'ব্লগ';
                _canGoBack = canGoBack;
              });
            }
          },
          onNavigationRequest: (request) {
            // Keep navigation inside the WebView for the blog domain
            if (request.url.startsWith('https://obhyash.vercel.app')) {
              return NavigationDecision.navigate;
            }
            // Open external links in browser
            launchUrl(
              Uri.parse(request.url),
              mode: LaunchMode.externalApplication,
            );
            return NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(Uri.parse(_blogUrl));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLoading = _loadingProgress < 100;

    return Column(
      children: [
        // Top progress bar
        if (isLoading)
          LinearProgressIndicator(
            value: _loadingProgress / 100,
            minHeight: 3,
            backgroundColor: Colors.transparent,
            color: const Color(0xFF10B981), // emerald-500
          )
        else
          const SizedBox(height: 3),

        // Mini toolbar
        Container(
          height: 44,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF171717) : Colors.white,
            border: Border(
              bottom: BorderSide(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFE5E5E5),
              ),
            ),
          ),
          child: Row(
            children: [
              // Back button
              IconButton(
                icon: Icon(
                  LucideIcons.chevronLeft,
                  size: 20,
                  color: _canGoBack
                      ? (isDark ? Colors.white : const Color(0xFF171717))
                      : (isDark
                            ? const Color(0xFF525252)
                            : const Color(0xFFD4D4D4)),
                ),
                onPressed: _canGoBack
                    ? () async {
                        if (await _controller.canGoBack()) {
                          await _controller.goBack();
                        }
                      }
                    : null,
              ),
              // Reload button
              IconButton(
                icon: Icon(
                  isLoading ? LucideIcons.x : LucideIcons.refreshCw,
                  size: 18,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF525252),
                ),
                onPressed: () {
                  if (isLoading) {
                    _controller.loadRequest(Uri.parse(_blogUrl));
                  } else {
                    _controller.reload();
                  }
                },
              ),
              // URL / title
              Expanded(
                child: Container(
                  height: 30,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFF5F5F5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _pageTitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
              // Open in browser
              IconButton(
                icon: Icon(
                  LucideIcons.externalLink,
                  size: 18,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF525252),
                ),
                onPressed: () => launchUrl(
                  Uri.parse(_blogUrl),
                  mode: LaunchMode.externalApplication,
                ),
              ),
            ],
          ),
        ),

        // WebView
        Expanded(child: WebViewWidget(controller: _controller)),
      ],
    );
  }
}
