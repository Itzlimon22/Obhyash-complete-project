import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'app_button_3d.dart';

class ProUpgradeModal extends StatelessWidget {
  final String title;
  final String message;
  final String? primaryButtonText;
  final String featurePill;
  final IconData icon;

  const ProUpgradeModal({
    super.key,
    this.title = 'সবগুলো ফ্রি পরীক্ষা সম্পন্ন!',
    this.message = 'আরো পরীক্ষা দিতে অভ্যাস প্রো-তে আপগ্রেড করো',
    this.primaryButtonText = 'অভ্যাস প্রো-তে আপগ্রেড করো',
    this.featurePill = 'প্রো মেম্বারশিপ',
    this.icon = LucideIcons.fileEdit,
  });

  static Future<void> show(
    BuildContext context, {
    String? title,
    String? message,
    String? primaryButtonText,
    String? featurePill,
    IconData? icon,
  }) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ProUpgradeModal(
        title: title ?? 'সবগুলো ফ্রি পরীক্ষা সম্পন্ন!',
        message: message ?? 'আরো পরীক্ষা দিতে অভ্যাস প্রো-তে আপগ্রেড করো',
        primaryButtonText: primaryButtonText ?? 'অভ্যাস প্রো-তে আপগ্রেড করো',
        featurePill: featurePill ?? 'প্রো মেম্বারশিপ',
        icon: icon ?? LucideIcons.fileEdit,
      ),
    );
  }

  Widget _build3DIconBadge(bool isDark) {
    return Center(
      child: SizedBox(
        width: 100,
        height: 100,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            // Outer 3D Squircle with emerald gradient & depth
            Container(
              width: 86,
              height: 86,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF047857),
                    Color(0xFF004633),
                    Color(0xFF012E22),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: const Color(0xFF34D399).withValues(alpha: 0.5),
                  width: 2.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF059669).withValues(alpha: 0.35),
                    blurRadius: 22,
                    offset: const Offset(0, 8),
                  ),
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.45),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Top inner glossy sheen
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.white.withValues(alpha: 0.22),
                            Colors.white.withValues(alpha: 0.0),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(22),
                        ),
                      ),
                    ),
                  ),
                  // Center Icon (Notebook with pen in warm amber gold)
                  const Icon(
                    LucideIcons.fileEdit,
                    color: Color(0xFFFDE68A),
                    size: 40,
                  ),
                ],
              ),
            ),

            // Alert "!" bubble at bottom-right
            Positioned(
              bottom: 2,
              right: 2,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFFF43F5E),
                      Color(0xFFBE123C),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark ? const Color(0xFF14171F) : Colors.white,
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFF43F5E).withValues(alpha: 0.5),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: const Text(
                  '!',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                    height: 1.1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 28),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF14171F) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 30,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top Bar: Drag pill in center & Close button on right
            Row(
              children: [
                const SizedBox(width: 36),
                Expanded(
                  child: Center(
                    child: Container(
                      width: 44,
                      height: 4.5,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white24 : Colors.black12,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF232733) : const Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      LucideIcons.x,
                      size: 18,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Center 3D Icon Badge
            _build3DIconBadge(isDark),

            const SizedBox(height: 22),

            // Title
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                letterSpacing: -0.3,
                height: 1.25,
              ),
            ),

            const SizedBox(height: 10),

            // Message
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w500,
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  height: 1.45,
                ),
              ),
            ),

            const SizedBox(height: 26),

            // 3D CTA Button (Obhyash emerald tactile button)
            AppButton3D(
              text: primaryButtonText ?? 'অভ্যাস প্রো-তে আপগ্রেড করো',
              height: 52,
              borderRadius: 16,
              depth: 5,
              baseColor: const Color(0xFF004633),
              shadowColor: const Color(0xFF002219),
              fontSize: 16,
              fontWeight: FontWeight.w800,
              onPressed: () {
                Navigator.pop(context);
                context.push('/profile/subscription');
              },
            ),

            const SizedBox(height: 14),

            // Secondary Button: 'এখন নয়'
            GestureDetector(
              onTap: () => Navigator.pop(context),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'এখন নয়',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
