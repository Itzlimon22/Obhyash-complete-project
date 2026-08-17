import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class ProUpgradeModal extends StatelessWidget {
  final String title;
  final String message;
  final String featurePill;
  final IconData icon;

  const ProUpgradeModal({
    super.key,
    this.title = 'প্রো সাবস্ক্রিপশন প্রয়োজন 👑',
    this.message = 'আনলিমিটেড এক্সাম, KaTeX ব্যাখ্যা ও পূর্ণাঙ্গ প্রশ্ন ব্যাংক পেতে প্রো সাবস্ক্রিপশন নাও।',
    this.featurePill = 'প্রো ফিচার',
    this.icon = LucideIcons.crown,
  });

  static Future<void> show(
    BuildContext context, {
    String? title,
    String? message,
    String? featurePill,
    IconData? icon,
  }) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ProUpgradeModal(
        title: title ?? 'প্রো সাবস্ক্রিপশন প্রয়োজন 👑',
        message: message ?? 'আনলিমিটেড এক্সাম, KaTeX ব্যাখ্যা ও পূর্ণাঙ্গ প্রশ্ন ব্যাংক পেতে প্রো সাবস্ক্রিপশন নাও।',
        featurePill: featurePill ?? 'প্রো ফিচার',
        icon: icon ?? LucideIcons.crown,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF13151F) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag Pill
            Center(
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Icon & Badge
            Center(
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFB45309), Color(0xFFD97706), Color(0xFFF59E0B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFD97706).withValues(alpha: 0.35),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Center(
                  child: Icon(icon, color: Colors.white, size: 30),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Feature Tag Pill
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFD97706).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFD97706).withValues(alpha: 0.4),
                    width: 1,
                  ),
                ),
                child: Text(
                  featurePill,
                  style: const TextStyle(
                    color: Color(0xFFD97706),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'HindSiliguri',
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),

            // Message
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                height: 1.4,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 18),

            // Mini Pricing Cards Preview
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1E2D) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF2E334D) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  _buildMiniTier(
                    name: '১ মাস',
                    price: '৳১৪৯',
                    sub: 'স্টার্টার',
                    isDark: isDark,
                    isPopular: false,
                  ),
                  const SizedBox(width: 8),
                  _buildMiniTier(
                    name: '৩ মাস',
                    price: '৳৩৪৯',
                    sub: 'জনপ্রিয় 🔥',
                    isDark: isDark,
                    isPopular: true,
                  ),
                  const SizedBox(width: 8),
                  _buildMiniTier(
                    name: '৬ মাস',
                    price: '৳৫৯৯',
                    sub: '৫০% ছাড় 👑',
                    isDark: isDark,
                    isPopular: false,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Upgrade Button
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                context.push('/profile/subscription');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 3,
                shadowColor: const Color(0xFF059669).withValues(alpha: 0.4),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.sparkles, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'প্রো প্ল্যানগুলো দেখো',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Later / Cancel
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'পরে করব',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniTier({
    required String name,
    required String price,
    required String sub,
    required bool isDark,
    required bool isPopular,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: isPopular
              ? (isDark ? const Color(0xFF064E3B).withValues(alpha: 0.3) : const Color(0xFFECFDF5))
              : (isDark ? const Color(0xFF262A3D) : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isPopular
                ? const Color(0xFF059669)
                : (isDark ? const Color(0xFF3B405A) : const Color(0xFFCBD5E1)),
            width: isPopular ? 1.5 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(
              name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              price,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                fontFamily: 'HindSiliguri',
                color: isPopular
                    ? const Color(0xFF059669)
                    : (isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7)),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
                color: isPopular ? const Color(0xFF059669) : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
