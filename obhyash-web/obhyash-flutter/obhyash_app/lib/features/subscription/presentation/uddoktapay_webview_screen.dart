import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons/lucide_icons.dart';
import 'package:webview_flutter/webview_flutter.dart';

class UddoktaPayWebViewScreen extends StatefulWidget {
  final String userId;
  final String planId;
  final String planName;
  final num amount;
  final String? customerName;
  final String? customerEmail;
  final String? customerPhone;

  const UddoktaPayWebViewScreen({
    super.key,
    required this.userId,
    required this.planId,
    required this.planName,
    required this.amount,
    this.customerName,
    this.customerEmail,
    this.customerPhone,
  });

  static Future<bool?> open(
    BuildContext context, {
    required String userId,
    required String planId,
    required String planName,
    required num amount,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
  }) {
    return Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (ctx) => UddoktaPayWebViewScreen(
          userId: userId,
          planId: planId,
          planName: planName,
          amount: amount,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
        ),
      ),
    );
  }

  @override
  State<UddoktaPayWebViewScreen> createState() => _UddoktaPayWebViewScreenState();
}

class _UddoktaPayWebViewScreenState extends State<UddoktaPayWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _errorMessage;
  String? _paymentUrl;

  @override
  void initState() {
    super.initState();
    _initializePayment();
  }

  Future<void> _initializePayment() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Direct call to UddoktaPay V2 checkout or Web API endpoint
      final url = Uri.parse('https://obhyash.paymently.io/api/checkout-v2');
      final payload = {
        'full_name': widget.customerName ?? 'Obhyash Student',
        'email': widget.customerEmail ?? 'student@obhyash.com',
        'amount': widget.amount.toString(),
        'metadata': {
          'user_id': widget.userId,
          'plan_id': widget.planId,
          'plan_name': widget.planName,
        },
        'redirect_url': 'https://obhyash.paymently.io/success',
        'cancel_url': 'https://obhyash.paymently.io/cancel',
        'webhook_url': 'https://obhyash.vercel.app/api/payment/uddoktapay/webhook',
      };

      final response = await http.post(
        url,
        headers: {
          'RT-UDDOKTAPAY-API-KEY': '9KrVMoMyjgX5e5itMtDIz2yvngV8Pzfey3d1qm2p',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['status'] == true && data['payment_url'] != null) {
        _paymentUrl = data['payment_url'] as String;
        _setupWebView(_paymentUrl!);
      } else {
        setState(() {
          _errorMessage = data['message']?.toString() ?? 'পেমেন্ট গেটওয়ে লোড করা সম্ভব হয়নি';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'ইন্টারনেট সমস্যা: $e';
        _isLoading = false;
      });
    }
  }

  void _setupWebView(String initialUrl) {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            _checkUrl(url);
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() => _isLoading = false);
            }
            _checkUrl(url);
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('[UddoktaPay] WebView error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(initialUrl));
  }

  void _checkUrl(String url) {
    if (url.contains('/success') || url.contains('status=COMPLETED') || url.contains('status=success')) {
      // Payment Successful
      Navigator.pop(context, true);
    } else if (url.contains('/cancel') || url.contains('status=CANCELLED')) {
      // Payment Cancelled
      Navigator.pop(context, false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      appBar: AppBar(
        title: const Text(
          'পেমেন্ট সম্পন্ন করুন',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'Anek Bangla',
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(LucideIcons.x),
          onPressed: () => Navigator.pop(context, false),
        ),
        elevation: 0,
      ),
      body: Stack(
        children: [
          if (_errorMessage != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.alertCircle, color: Color(0xFFEF4444), size: 48),
                    const SizedBox(height: 16),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 15,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _initializePayment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('আবার চেষ্টা করুন'),
                    ),
                  ],
                ),
              ),
            )
          else if (_paymentUrl != null)
            WebViewWidget(controller: _controller),

          if (_isLoading)
            Container(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Color(0xFF059669)),
                    SizedBox(height: 16),
                    Text(
                      'সুরক্ষিত পেমেন্ট গেটওয়ে লোড হচ্ছে...',
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'Anek Bangla',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
