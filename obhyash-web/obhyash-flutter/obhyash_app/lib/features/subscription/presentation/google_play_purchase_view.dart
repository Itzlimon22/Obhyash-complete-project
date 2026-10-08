import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../dashboard/providers/dashboard_providers.dart';
import '../domain/models.dart';
import '../services/in_app_purchase_service.dart';

/// Chorcha-style dedicated Google Play In-App Purchase Screen
/// Fully compliant with Google Play Subscription & EULA policies.
class GooglePlayPurchaseView extends ConsumerStatefulWidget {
  final SubscriptionPlan initialPlan;
  final List<SubscriptionPlan>? allPlans;

  const GooglePlayPurchaseView({
    super.key,
    required this.initialPlan,
    this.allPlans,
  });

  @override
  ConsumerState<GooglePlayPurchaseView> createState() =>
      _GooglePlayPurchaseViewState();
}

class _GooglePlayPurchaseViewState
    extends ConsumerState<GooglePlayPurchaseView> {
  late SubscriptionPlan _selectedPlan;
  List<SubscriptionPlan> _plans = [];
  bool _isLoadingPlans = false;
  bool _isPurchasing = false;
  StreamSubscription<PurchaseResult>? _purchaseSub;

  final InAppPurchaseService _iapService = InAppPurchaseService();

  @override
  void initState() {
    super.initState();
    _selectedPlan = widget.initialPlan;

    if (widget.allPlans != null && widget.allPlans!.isNotEmpty) {
      _plans = widget.allPlans!;
    } else {
      _loadAvailablePlans();
    }

    // Refresh Google Play products
    _iapService.loadProducts().then((_) {
      if (mounted) setState(() {});
    });

    // Listen to Google Play purchase updates
    _purchaseSub = _iapService.purchaseStream.listen(_handlePurchaseResult);
  }

  @override
  void dispose() {
    _purchaseSub?.cancel();
    super.dispose();
  }

  Future<void> _loadAvailablePlans() async {
    setState(() => _isLoadingPlans = true);
    try {
      final res = await Supabase.instance.client
          .from('subscription_plans')
          .select()
          .order('duration_days', ascending: true);

      final loaded = (res as List)
          .map((data) => SubscriptionPlan.fromJson(data as Map<String, dynamic>))
          .where((p) => p.price > 0)
          .toList();

      if (mounted && loaded.isNotEmpty) {
        setState(() {
          _plans = loaded;
          // Ensure selected plan matches loaded list
          final match = _plans.firstWhere(
            (p) => p.id == _selectedPlan.id || p.durationDays == _selectedPlan.durationDays,
            orElse: () => _selectedPlan,
          );
          _selectedPlan = match;
        });
      }
    } catch (e) {
      debugPrint('[GooglePlayPurchaseView] Error loading plans: $e');
    } finally {
      if (mounted) setState(() => _isLoadingPlans = false);
    }
  }

  void _handlePurchaseResult(PurchaseResult result) {
    if (!mounted) return;

    if (result.state == PurchaseState.pending) {
      setState(() => _isPurchasing = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('গুগল প্লে পেমেন্ট প্রক্রিয়াধীন রয়েছে...'),
          duration: Duration(seconds: 3),
        ),
      );
    } else if (result.state == PurchaseState.success) {
      setState(() => _isPurchasing = false);
      ref.invalidate(userProfileProvider);

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 28),
              SizedBox(width: 10),
              Text('অভিনন্দন! 🎉', style: TextStyle(fontWeight: FontWeight.w800)),
            ],
          ),
          content: const Text(
            'তোমার প্রো সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে! এখন সকল ফিচার আনলক।',
            style: TextStyle(fontSize: 14, height: 1.5),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx); // Close dialog
                Navigator.pop(context); // Exit purchase page
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF004633),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('শুরু করুন'),
            ),
          ],
        ),
      );
    } else if (result.state == PurchaseState.error) {
      setState(() => _isPurchasing = false);
      _showErrorDialog(result.errorMessage ?? 'পেমেন্ট সম্পন্ন করা সম্ভব হয়নি।');
    } else if (result.state == PurchaseState.cancelled) {
      setState(() => _isPurchasing = false);
    }
  }

  void _showErrorDialog(String msg) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.info_outline_rounded, color: Color(0xFFEF4444), size: 26),
            SizedBox(width: 8),
            Text('পেমেন্ট নোটিশ', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(msg, style: const TextStyle(fontSize: 14, height: 1.5)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('ঠিক আছে', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleBuy() async {
    if (_isPurchasing) return;
    setState(() => _isPurchasing = true);

    InAppPurchaseService.onSubscriptionActivated = () {
      ref.invalidate(userProfileProvider);
    };

    final launched = await _iapService.purchasePlan(_selectedPlan);

    if (!launched && mounted) {
      setState(() => _isPurchasing = false);

      if (kDebugMode) {
        // Helpful diagnostic dialog for developer in debug mode
        _showDebugSimulatorDialog();
      } else {
        _showErrorDialog(
          'গুগল প্লে স্টোর বিলিং সার্ভিসের সাথে সংযোগ করা সম্ভব হয়নি। অনুগ্রহ করে প্লে-স্টোর অ্যাকাউন্ট ও ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।',
        );
      }
    }
  }

  /// Simulation dialog for developer when testing in debug mode
  void _showDebugSimulatorDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(LucideIcons.code, color: Color(0xFF6366F1), size: 24),
            SizedBox(width: 8),
            Text('Debug Mode Notice', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'তুমি অ্যাপটি লোকাল ডিবাগ মোডে চালাচ্ছ। গুগল প্লে বিলিং সিকিউরিটির জন্য আন-রিলিজড ডিবাগ বিল্ডে প্রোডাক্ট রিটার্ন করে না।',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
            SizedBox(height: 12),
            Text(
              'রিয়েল গুগল প্লে উইন্ডো দেখতে অ্যাপটি প্লে-স্টোরের Internal Testing ট্র্যাক থেকে ইনস্টল করো।',
              style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.3),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('বন্ধ করুন'),
          ),
        ],
      ),
    );
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('[GooglePlayPurchaseView] Cannot launch $url: $e');
    }
  }

  /// Get display price from Google Play ProductDetails if available, or designated Google Play Tier
  String _getPriceDisplay(SubscriptionPlan plan) {
    final sku = _iapService.getSkuForPlan(plan);
    final product = _iapService.products[sku];
    if (product != null && product.price.isNotEmpty) {
      return product.price;
    }

    // Google Play Store Billing Tiers (Elevated pricing to prioritize direct MFS)
    if (plan.durationDays >= 365) {
      return 'BDT 12,990.00';
    } else if (plan.durationDays >= 180 || plan.id.contains('6m') || plan.name.contains('৬')) {
      return 'BDT 7,990.00';
    } else if (plan.durationDays >= 90 || plan.id.contains('3m') || plan.name.contains('৩')) {
      return 'BDT 3,490.00';
    }
    return 'BDT 1,490.00';
  }

  String _getDurationSubtitle(SubscriptionPlan plan) {
    if (plan.durationDays >= 365) return '12 months';
    if (plan.durationDays >= 180) return '6 months';
    if (plan.durationDays >= 90) return '3 months';
    return '1 month';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final plansToDisplay = _plans.isNotEmpty ? _plans : [_selectedPlan];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0F13) : Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : const Color(0xFF1E293B),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: Text(
          'Google Play Subscription',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            children: [
              const SizedBox(height: 16),

              // ── Plan Cards List (Chorcha Style) ─────────────────────────
              Expanded(
                child: _isLoadingPlans
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.separated(
                        itemCount: plansToDisplay.length,
                        separatorBuilder: (ctx, idx) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          final plan = plansToDisplay[index];
                          final isSelected = plan.id == _selectedPlan.id ||
                              (plan.durationDays == _selectedPlan.durationDays);
                          final priceStr = _getPriceDisplay(plan);
                          final durationStr = _getDurationSubtitle(plan);

                          return _buildChorchaPlanCard(
                            isDark: isDark,
                            isSelected: isSelected,
                            title: 'PREMIUM',
                            subtitle: durationStr,
                            price: priceStr,
                            onTap: () {
                              setState(() => _selectedPlan = plan);
                            },
                          );
                        },
                      ),
              ),

              // ── Bottom Action Area (Buy Button + EULA & Privacy) ────────
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Gradient Buy Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF06B6D4), // Cyan/Teal
                            Color(0xFF4F46E5), // Indigo/Purple
                          ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: _isPurchasing ? null : _handleBuy,
                          child: Center(
                            child: _isPurchasing
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      color: Colors.white,
                                    ),
                                  )
                                : Text(
                                    'Buy ${_getPriceDisplay(_selectedPlan)}',
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // EULA and Privacy Policy Links (Google Policy Mandatory)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        GestureDetector(
                          onTap: () => _openUrl('https://obhyash.com/terms'),
                          child: Text(
                            'Terms of Use (EULA)',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : const Color(0xFF64748B),
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10.0),
                          child: Text(
                            '·',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white38 : Colors.black38,
                            ),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => _openUrl('https://obhyash.com/privacy'),
                          child: Text(
                            'Privacy Policy',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              color: isDark
                                  ? const Color(0xFF94A3B8)
                                  : const Color(0xFF64748B),
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Custom Card mimicking the exact Chorcha style from screenshot
  Widget _buildChorchaPlanCard({
    required bool isDark,
    required bool isSelected,
    required String title,
    required String subtitle,
    required String price,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: isDark
              ? (isSelected ? const Color(0xFF1E1E28) : const Color(0xFF16161E))
              : (isSelected ? const Color(0xFFF0FDF4).withValues(alpha: 0.3) : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? Border.all(
                  width: 2.2,
                  color: const Color(0xFF6366F1), // Gradient purple/indigo border
                )
              : Border.all(
                  width: 1.2,
                  color: isDark ? const Color(0xFF272733) : const Color(0xFFE2E8F0),
                ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            // Custom Gradient Radio Indicator
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? const Color(0xFF6366F1) : const Color(0xFF94A3B8),
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [Color(0xFF06B6D4), Color(0xFF6366F1)],
                          ),
                        ),
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 14),

            // Plan Title & Duration Subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),

            // Price on the right
            Text(
              price,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
