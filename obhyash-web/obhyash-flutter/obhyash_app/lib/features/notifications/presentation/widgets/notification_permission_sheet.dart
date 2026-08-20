import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../services/notification_permission_manager.dart';
import '../../services/notification_service.dart';

class NotificationPermissionSheet extends StatelessWidget {
  const NotificationPermissionSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const NotificationPermissionSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 24,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 44,
              height: 4.5,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 20),

            // Icon with glowing aura
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF059669).withValues(alpha: 0.15),
                    const Color(0xFF10B981).withValues(alpha: 0.08),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFF059669).withValues(alpha: 0.3),
                  width: 1.5,
                ),
              ),
              child: const Icon(
                LucideIcons.bellRing,
                color: Color(0xFF059669),
                size: 36,
              ),
            ),
            const SizedBox(height: 18),

            // Title
            Text(
              'পড়াশোনা ও স্ট্রিক যাতে মিস না হয়',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 21,
                fontWeight: FontWeight.bold,
                fontFamily: 'Anek Bangla',
                color: isDark ? Colors.white : const Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 8),

            // Subtitle
            Text(
              'তোমার পরীক্ষার প্রস্তুতি আরও গোছানো রাখতে গুরুত্বপূর্ণ আপডেটগুলো সময়মতো জেনে নাও',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'HindSiliguri',
                height: 1.4,
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF4B5563),
              ),
            ),
            const SizedBox(height: 22),

            // Feature points
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF242730) : const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
                ),
              ),
              child: Column(
                children: [
                  _buildBenefitRow(
                    icon: LucideIcons.flame,
                    iconColor: const Color(0xFFEF4444),
                    title: 'স্ট্রিক সেভার অ্যালার্ট',
                    desc: 'রাত ৮:৩০ টায় স্ট্রিক বাঁচানোর মজার রিমাইন্ডার',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 12),
                  _buildBenefitRow(
                    icon: LucideIcons.timer,
                    iconColor: const Color(0xFF3B82F6),
                    title: 'লাইভ পরীক্ষা রিমাইন্ডার',
                    desc: 'পরীক্ষা শুরুর ১৫ মিনিট আগে বিশেষ সংকেত',
                    isDark: isDark,
                  ),
                  const SizedBox(height: 12),
                  _buildBenefitRow(
                    icon: LucideIcons.trophy,
                    iconColor: const Color(0xFFEAB308),
                    title: 'ফলাফল ও র‍্যাংকিং',
                    desc: 'পরীক্ষার রেজাল্ট প্রকাশের সাথে সাথে নোটিশ',
                    isDark: isDark,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Primary Enable Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () async {
                  Navigator.pop(context);
                  await NotificationPermissionManager.recordGranted();
                  await NotificationService().requestPermission();
                },
                icon: const Icon(LucideIcons.bell, size: 20),
                label: const Text(
                  'হ্যাঁ, নোটিফিকেশন চালু রাখুন',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Anek Bangla',
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Secondary Later Button
            SizedBox(
              width: double.infinity,
              height: 44,
              child: TextButton(
                onPressed: () async {
                  Navigator.pop(context);
                  await NotificationPermissionManager.recordDismissed();
                },
                child: Text(
                  'পরে করবো',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBenefitRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String desc,
    required bool isDark,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Anek Bangla',
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
              ),
              Text(
                desc,
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
