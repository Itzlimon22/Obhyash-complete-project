import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:obhyash_app/features/subscription/presentation/payment_view.dart';
import '../../../../core/providers/app_config_provider.dart';
import '../../domain/models.dart';
import '../../services/in_app_purchase_service.dart';

/// Chorcha-style bottom sheet modal for choosing a payment method.
class PaymentMethodSheet extends ConsumerWidget {
  final SubscriptionPlan plan;
  final String? appliedCouponCode;

  const PaymentMethodSheet({
    super.key,
    required this.plan,
    this.appliedCouponCode,
  });

  /// Static helper to show the payment method bottom sheet.
  static Future<void> show({
    required BuildContext context,
    required SubscriptionPlan plan,
    String? appliedCouponCode,
  }) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      builder: (_) => PaymentMethodSheet(
        plan: plan,
        appliedCouponCode: appliedCouponCode,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final autoEnabled = ref.watch(isPaymentAutoEnabledProvider);
    final manualEnabled = ref.watch(isPaymentManualEnabledProvider);
    final googlePlayEnabled = ref.watch(isPaymentGooglePlayEnabledProvider);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141417) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.only(
        top: 10,
        left: 20,
        right: 20,
        bottom: 28,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top drag handle
            Center(
              child: Container(
                width: 42,
                height: 4.5,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),

            // Header: Title & Close Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Payment Method',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${plan.name} • ৳${plan.price}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    Icons.close,
                    size: 22,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                  ),
                  splashRadius: 20,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // ── Option 1: Automatic Payment ────────────────────────────────
            if (autoEnabled) ...[
              _PaymentOptionCard(
                isDark: isDark,
                title: 'Automatic Payment',
                subtitle: 'bKash, Nagad, Rocket, Cards (তাত্ক্ষণিক সক্রিয়)',
                badge: _buildAutoBadge(),
                onTap: () {
                  final nav = Navigator.of(context, rootNavigator: true);
                  Navigator.pop(context);
                  nav.push(
                    MaterialPageRoute(
                      builder: (_) => PaymentView.auto(
                        plan: plan,
                        appliedCouponCode: appliedCouponCode,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
            ],

            // ── Option 2: Manual Payment ──────────────────────────────────
            if (manualEnabled) ...[
              _PaymentOptionCard(
                isDark: isDark,
                title: 'Manual Payment',
                subtitle: 'Send Money করে TrxID দিয়ে ভেরিফিকেশন',
                badge: _buildManualBadge(),
                onTap: () {
                  final nav = Navigator.of(context, rootNavigator: true);
                  Navigator.pop(context);
                  nav.push(
                    MaterialPageRoute(
                      builder: (_) => PaymentView.manual(
                        plan: plan,
                        appliedCouponCode: appliedCouponCode,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
            ],

            // ── Option 3: In App Purchase (Google Play) ────────────────────
            if (googlePlayEnabled) ...[
              _PaymentOptionCard(
                isDark: isDark,
                title: 'In App Purchase',
                subtitle: 'Google Play Store Billing',
                badge: _buildGooglePlayBadge(),
                onTap: () {
                  Navigator.pop(context);
                  _showGooglePlayPurchaseSheet(context, plan);
                },
              ),
            ],

            // Fallback if all payment methods are disabled
            if (!autoEnabled && !manualEnabled && !googlePlayEnabled) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1E24) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? const Color(0xFF2E2E36) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.alertCircle, color: Color(0xFFF59E0B), size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'বর্তমানে সকল পেমেন্ট মেথড সাময়িকভাবে স্থগিত রয়েছে। খুব শীঘ্রই পুনরায় চালু করা হবে।',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white70 : const Color(0xFF334155),
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAutoBadge() {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFFD11559).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFD11559).withValues(alpha: 0.25),
        ),
      ),
      child: const Center(
        child: Icon(
          LucideIcons.zap,
          color: Color(0xFFD11559),
          size: 22,
        ),
      ),
    );
  }

  Widget _buildManualBadge() {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFF059669).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF059669).withValues(alpha: 0.25),
        ),
      ),
      child: const Center(
        child: Icon(
          LucideIcons.fileCheck,
          color: Color(0xFF059669),
          size: 22,
        ),
      ),
    );
  }

  Widget _buildGooglePlayBadge() {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Center(
        child: _GooglePlayLogo(size: 22),
      ),
    );
  }

  void _showGooglePlayPurchaseSheet(BuildContext context, SubscriptionPlan plan) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _GooglePlayPurchaseModal(plan: plan),
    );
  }
}

/// Stylized Option Card matching Chorcha's exact payment method card design
class _PaymentOptionCard extends StatelessWidget {
  final bool isDark;
  final String title;
  final String subtitle;
  final Widget badge;
  final VoidCallback onTap;

  const _PaymentOptionCard({
    required this.isDark,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1D1D22) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF2E2E36) : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.3)
                  : Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            badge,
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2.5),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }
}

/// Accurate 4-color Google Play Triangle Logo
class _GooglePlayLogo extends StatelessWidget {
  final double size;

  const _GooglePlayLogo({this.size = 22});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _GooglePlayPainter(),
    );
  }
}

class _GooglePlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Blue bottom-left triangle
    final bluePaint = Paint()..color = const Color(0xFF0086F8);
    final bluePath = Path()
      ..moveTo(w * 0.12, h * 0.08)
      ..lineTo(w * 0.58, h * 0.50)
      ..lineTo(w * 0.12, h * 0.92)
      ..close();
    canvas.drawPath(bluePath, bluePaint);

    // Green top triangle
    final greenPaint = Paint()..color = const Color(0xFF00C853);
    final greenPath = Path()
      ..moveTo(w * 0.12, h * 0.08)
      ..lineTo(w * 0.76, h * 0.40)
      ..lineTo(w * 0.58, h * 0.50)
      ..close();
    canvas.drawPath(greenPath, greenPaint);

    // Yellow right triangle
    final yellowPaint = Paint()..color = const Color(0xFFFFD600);
    final yellowPath = Path()
      ..moveTo(w * 0.76, h * 0.40)
      ..lineTo(w * 0.92, h * 0.50)
      ..lineTo(w * 0.76, h * 0.60)
      ..lineTo(w * 0.58, h * 0.50)
      ..close();
    canvas.drawPath(yellowPath, yellowPaint);

    // Red bottom triangle
    final redPaint = Paint()..color = const Color(0xFFFF3D00);
    final redPath = Path()
      ..moveTo(w * 0.12, h * 0.92)
      ..lineTo(w * 0.58, h * 0.50)
      ..lineTo(w * 0.76, h * 0.60)
      ..close();
    canvas.drawPath(redPath, redPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Official Google Play purchase confirmation sheet
class _GooglePlayPurchaseModal extends StatefulWidget {
  final SubscriptionPlan plan;

  const _GooglePlayPurchaseModal({required this.plan});

  @override
  State<_GooglePlayPurchaseModal> createState() => _GooglePlayPurchaseModalState();
}

class _GooglePlayPurchaseModalState extends State<_GooglePlayPurchaseModal> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final userEmail = Supabase.instance.client.auth.currentUser?.email ?? 'student@obhyash.com';

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E24) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(22),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Google Play header
            Row(
              children: [
                const _GooglePlayLogo(size: 24),
                const SizedBox(width: 10),
                Text(
                  'Google Play',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              ],
            ),
            const Divider(height: 24),

            // Plan details
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.plan.name,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Obhyash - অভ্যাস এডুকেশন',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                Text(
                  '৳${widget.plan.price}.00',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Google Account info
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.account_circle_outlined,
                    size: 18,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      userEmail,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF334155),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    'Google Play Balance',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF059669),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Buy button
            ElevatedButton(
              onPressed: _isProcessing
                  ? null
                  : () async {
                      final nav = Navigator.of(context);
                      final messenger = ScaffoldMessenger.of(context);
                      setState(() => _isProcessing = true);

                      final iapService = InAppPurchaseService();
                      final launched = await iapService.purchasePlan(widget.plan);

                      if (mounted) {
                        setState(() => _isProcessing = false);
                        nav.pop();

                        if (launched) {
                          messenger.showSnackBar(
                            SnackBar(
                              content: const Text(
                                'Google Play পেমেন্ট প্রক্রিয়া চালু হয়েছে...',
                                style: TextStyle(fontWeight: FontWeight.w600),
                              ),
                              backgroundColor: const Color(0xFF0086F8),
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          );
                        } else {
                          // Product awaiting sync in Play Console or sandbox fallback
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                'Google Play Billing কনফিগার সম্পন্ন (${iapService.getSkuForPlan(widget.plan)})। প্লে কনসোলে রিলিজের পর গুগল সরাসরি চার্জ করবে।',
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              backgroundColor: const Color(0xFF0F172A),
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              duration: const Duration(seconds: 4),
                            ),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0086F8),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      '1-ট্যাপে কিনুন (1-Tap Buy)',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
