import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class XpGuideBottomSheet extends StatelessWidget {
  const XpGuideBottomSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (_) => const XpGuideBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF18181B) : Colors.white;
    final cardBg = isDark ? const Color(0xFF27272A) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0);
    final titleColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final subtitleColor = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.52,
        ),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Drag Handle ──
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(height: 12),

            // ── Header ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(LucideIcons.zap, color: Color(0xFFF59E0B), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'XP ও লেভেল গাইড',
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: titleColor,
                          ),
                        ),
                        Text(
                          'কীভাবে XP অর্জন করে লেভেল আপ করবে',
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontSize: 11.5,
                            color: subtitleColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: Icon(LucideIcons.x, size: 19, color: subtitleColor),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Divider(height: 1, color: borderColor),

            // ── Scrollable Content ──
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
                children: [

                  // ── XP Rules — Compact horizontal chips ──
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'XP অর্জনের নিয়ম',
                          style: TextStyle(
                            fontFamily: 'Anek Bangla',
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: titleColor,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _buildXpRow(
                          icon: LucideIcons.checkCircle2,
                          iconColor: const Color(0xFF10B981),
                          label: 'সঠিক উত্তর',
                          value: '+২ XP',
                          valueColor: const Color(0xFF10B981),
                          subtitleColor: subtitleColor,
                        ),
                        const SizedBox(height: 7),
                        _buildXpRow(
                          icon: LucideIcons.xCircle,
                          iconColor: const Color(0xFFEF4444),
                          label: 'ভুল উত্তর',
                          value: '-১ XP',
                          valueColor: const Color(0xFFEF4444),
                          subtitleColor: subtitleColor,
                        ),
                        const SizedBox(height: 7),
                        _buildXpRow(
                          icon: LucideIcons.ticket,
                          iconColor: const Color(0xFF3B82F6),
                          label: 'পরীক্ষা সম্পন্ন',
                          value: '+৫ থেকে +১০ XP',
                          valueColor: const Color(0xFF3B82F6),
                          subtitleColor: subtitleColor,
                        ),
                        const SizedBox(height: 7),
                        _buildXpRow(
                          icon: LucideIcons.trophy,
                          iconColor: const Color(0xFFF59E0B),
                          label: 'লাইভ এক্সাম ১ম স্থান',
                          value: '+৫০ XP বোনাস',
                          valueColor: const Color(0xFFF59E0B),
                          subtitleColor: subtitleColor,
                        ),
                        const SizedBox(height: 7),
                        _buildXpRow(
                          icon: LucideIcons.flame,
                          iconColor: const Color(0xFFFF6B35),
                          label: 'স্ট্রিক বুস্ট (৭ দিন+)',
                          value: '১.২x — ১.৩x গুণ',
                          valueColor: const Color(0xFFFF6B35),
                          subtitleColor: subtitleColor,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Level Milestones ──
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF004633).withValues(alpha: 0.12),
                          const Color(0xFF059669).withValues(alpha: 0.05),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF059669).withValues(alpha: 0.25),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(LucideIcons.shield, color: Color(0xFF059669), size: 15),
                            const SizedBox(width: 7),
                            Text(
                              'লেভেল ও XP সীমা',
                              style: TextStyle(
                                fontFamily: 'Anek Bangla',
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: titleColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        _buildLevelRow('🌱', 'রুকি', '০ – ৪৯৯ XP', subtitleColor),
                        _buildLevelRow('🏹', 'স্কাউট', '৫০০ – ১,৯৯৯ XP', subtitleColor),
                        _buildLevelRow('⚔️', 'ওয়ারিয়র', '২,০০০ – ৪,৯৯৯ XP', subtitleColor),
                        _buildLevelRow('🛡️', 'টাইটান', '৫,০০০ – ৯,৯৯৯ XP', subtitleColor),
                        _buildLevelRow('👑', 'লিজেন্ড', '১০,০০০+ XP', subtitleColor),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildXpRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    required Color valueColor,
    required Color subtitleColor,
  }) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 15),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: subtitleColor,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
          decoration: BoxDecoration(
            color: valueColor.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(7),
          ),
          child: Text(
            value,
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLevelRow(String emoji, String title, String range, Color subtitleColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 7),
          Text(
            title,
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: subtitleColor,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '·  $range',
            style: TextStyle(
              fontFamily: 'HindSiliguri',
              fontSize: 11.5,
              color: subtitleColor.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}
