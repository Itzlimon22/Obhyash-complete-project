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

    // Height strictly capped at half of screen (50% max)
    final sheetHeight = MediaQuery.of(context).size.height * 0.50;

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
      child: Container(
        height: sheetHeight,
        constraints: BoxConstraints(
          maxHeight: sheetHeight,
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
          // ── Pinned Top Header (Non-Scrolling) ──
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
                  child: const Icon(
                    LucideIcons.zap,
                    color: Color(0xFFF59E0B),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'XP ও রিওয়ার্ড গাইডলাইন',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: titleColor,
                        ),
                      ),
                      Text(
                        'কীভাবে পয়েন্ট ও লেভেল অর্জন করবে',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 12,
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

          // ── Scrollable Body Content (Niche Scrolling) ──
          Expanded(
            child: ListView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 20),
              children: [
                // 1. Core Exam XP
                _buildRuleCard(
                  cardBg: cardBg,
                  borderColor: borderColor,
                  icon: LucideIcons.checkCircle2,
                  iconColor: const Color(0xFF10B981),
                  title: '১. নির্ভুল উত্তরের পয়েন্ট (Accuracy)',
                  points: '+২ XP / -১ XP',
                  pointsColor: const Color(0xFF10B981),
                  description:
                      'প্রতিটি সঠিক উত্তরের জন্য ২ XP পাবে। ভুল উত্তর দিলে ১ XP কাটা যাবে (তবে মোট XP কখনো ০-এর নিচে নামবে না)। স্কিপ করা প্রশ্নে কোনো পয়েন্ট কাটা যায় না।',
                  titleColor: titleColor,
                  subtitleColor: subtitleColor,
                ),

                const SizedBox(height: 10),

                // 2. Attendance / Participation
                _buildRuleCard(
                  cardBg: cardBg,
                  borderColor: borderColor,
                  icon: LucideIcons.ticket,
                  iconColor: const Color(0xFF3B82F6),
                  title: '২. পরীক্ষা সম্পন্নের নিশ্চয়তা (Base XP)',
                  points: '+৫ থেকে +১০ XP',
                  pointsColor: const Color(0xFF3B82F6),
                  description:
                      'যেকোনো মক টেস্ট সম্পন্ন করলে নিশ্চিত +৫ XP এবং লাইভ এক্সামে অংশ নিয়ে সাবমিট করলে নিশ্চিত +১০ XP যোগ হবে।',
                  titleColor: titleColor,
                  subtitleColor: subtitleColor,
                ),

                const SizedBox(height: 10),

                // 3. Perfect Score
                _buildRuleCard(
                  cardBg: cardBg,
                  borderColor: borderColor,
                  icon: LucideIcons.sparkles,
                  iconColor: const Color(0xFF8B5CF6),
                  title: '৩. ক্লিন শিট / শতভাগ সঠিক বোনাস',
                  points: '+১০ XP বোনাস',
                  pointsColor: const Color(0xFF8B5CF6),
                  description:
                      'ন্যূনতম ৫ প্রশ্নের পরীক্ষায় কোনো ভুল না করে ১০০% সঠিক উত্তর দিতে পারলে এক্সট্রা +১০ XP ক্লিন শিট বোনাস পাওয়া যাবে।',
                  titleColor: titleColor,
                  subtitleColor: subtitleColor,
                ),

                const SizedBox(height: 10),

                // 4. Speed Bonus
                _buildRuleCard(
                  cardBg: cardBg,
                  borderColor: borderColor,
                  icon: LucideIcons.timer,
                  iconColor: const Color(0xFFEC4899),
                  title: '৪. স্পিড ও টাইম এফিসিয়েন্সি বোনাস',
                  points: '+১ XP প্রতি অবশিষ্ট মিনিট',
                  pointsColor: const Color(0xFFEC4899),
                  description:
                      'পরীক্ষায় ৮০% বা তার বেশি সঠিকতা অর্জন করে সময়ের আগে শেষ করলে প্রতি অবশিষ্ট ১ মিনিটের জন্য +১ XP (সর্বোচ্চ ৫ XP পর্যন্ত) বোনাস পাওয়া যাবে।',
                  titleColor: titleColor,
                  subtitleColor: subtitleColor,
                ),

                const SizedBox(height: 10),

                // 5. Streak Booster
                _buildRuleCard(
                  cardBg: cardBg,
                  borderColor: borderColor,
                  icon: LucideIcons.flame,
                  iconColor: const Color(0xFFEF4444),
                  title: '৫. স্ট্রিক বুস্টার মাল্টিপ্লায়ার',
                  points: '১.১x থেকে ১.৩x গুণ',
                  pointsColor: const Color(0xFFEF4444),
                  description:
                      'টানা পড়ার ধারাবাহিকতায় মোট XP গুণিতক হারে বাড়ে:\n• ৩-৬ দিন স্ট্রিক: ১.১x গুণ XP (+10%)\n• ৭-১৩ দিন স্ট্রিক: ১.২x গুণ XP (+20%)\n• ১৪+ দিন স্ট্রিক: ১.৩x গুণ XP (+30%)',
                  titleColor: titleColor,
                  subtitleColor: subtitleColor,
                ),

                const SizedBox(height: 10),

                // 6. Live Exam Ranks
                _buildRuleCard(
                  cardBg: cardBg,
                  borderColor: borderColor,
                  icon: LucideIcons.trophy,
                  iconColor: const Color(0xFFF59E0B),
                  title: '৬. লাইভ এক্সাম লিডারবোর্ড রিওয়ার্ড',
                  points: '+১০ থেকে +৫০ XP',
                  pointsColor: const Color(0xFFF59E0B),
                  description:
                      'লাইভ পরীক্ষায় শীর্ষ স্থানে থাকলে বিশেষ বোনাস:\n• ১ম স্থান: +৫০ XP\n• ২য় ও ৩য় স্থান: +৩০ XP\n• ৪র্থ থেকে ১০ম স্থান: +২০ XP\n• ১১তম থেকে ২৫তম স্থান: +১০ XP',
                  titleColor: titleColor,
                  subtitleColor: subtitleColor,
                ),

                const SizedBox(height: 12),

                // Level Milestones
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
                          const Icon(LucideIcons.shield, color: Color(0xFF059669), size: 16),
                          const SizedBox(width: 8),
                          Text(
                            'লেভেল টাইটেল ও ধাপসমূহ',
                            style: TextStyle(
                              fontFamily: 'Anek Bangla',
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: titleColor,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '🌱 রুকি (Rookie): ০ - ৪৯৯ XP\n'
                        '🏹 স্কাউট (Scout): ৫০০ - ১,৯৯৯ XP\n'
                        '⚔️ ওয়ারিয়র (Warrior): ২,০০০ - ৪,৯৯৯ XP\n'
                        '🛡️ টাইটান (Titan): ৫,০০০ - ৯,৯৯৯ XP\n'
                        '👑 লিজেন্ড (Legend): ১০,০০০+ XP',
                        style: TextStyle(
                          fontFamily: 'Anek Bangla',
                          fontSize: 12.5,
                          height: 1.55,
                          fontWeight: FontWeight.w600,
                          color: subtitleColor,
                        ),
                      ),
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

  Widget _buildRuleCard({
    required Color cardBg,
    required Color borderColor,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String points,
    required Color pointsColor,
    required String description,
    required Color titleColor,
    required Color subtitleColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, color: iconColor, size: 15),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontFamily: 'Anek Bangla',
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: titleColor,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: pointsColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  points,
                  style: TextStyle(
                    fontFamily: 'HindSiliguri',
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: pointsColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),
          Text(
            description,
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              fontSize: 12,
              height: 1.45,
              color: subtitleColor,
            ),
          ),
        ],
      ),
    );
  }
}
