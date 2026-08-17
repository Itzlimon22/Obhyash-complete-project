import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class PrivacyPolicyView extends StatelessWidget {
  const PrivacyPolicyView({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA);
    final cardBg = isDark ? const Color(0xFF18181B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);

    return Scaffold(
      backgroundColor: bgColor,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Hero Banner ──────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: isDark
                    ? const LinearGradient(
                        colors: [Color(0xFF14241E), Color(0xFF0F1714)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : const LinearGradient(
                        colors: [Color(0xFFECFDF5), Color(0xFFF0FDF4)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: const Color(0xFF059669).withValues(alpha: isDark ? 0.35 : 0.2),
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF059669).withValues(alpha: isDark ? 0.12 : 0.06),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: isDark ? 0.25 : 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF059669).withValues(alpha: 0.4),
                        width: 1.5,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        LucideIcons.shieldCheck,
                        color: Color(0xFF10B981),
                        size: 28,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'গোপনীয়তা ও নিরাপত্তা নীতি',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'তোমার ব্যক্তিগত ও একাডেমিক তথ্যের শতভাগ নিরাপত্তা আমাদের সর্বোচ্চ অগ্রাধিকার।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.45,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'সর্বশেষ হালনাগাদ: ১৫ আগস্ট, ২০২৬',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ── Policy Cards ─────────────────────────────────────────────────
            _PolicyCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.userCheck,
              iconColor: const Color(0xFF3B82F6),
              title: '১. আমরা যেসব তথ্য সংগ্রহ করি',
              items: const [
                'ব্যক্তিগত তথ্য: নাম, ইমেইল অ্যাড্রেস, ফোন নম্বর এবং প্রোফাইল পিকচার।',
                'একাডেমিক প্রোফাইল: ক্লাস/এইচএসসি ব্যাচ, শিক্ষাপ্রতিষ্ঠানের নাম, গ্রুপ ও টার্গেট।',
                'পরীক্ষার ডেটা: বিষয়ভিত্তিক মক টেস্ট স্কোর, বিস্তারিত উত্তরপত্র ও এনালাইসিস।',
                'ব্যবহারের তথ্য: প্রতিদিনের প্র্যাকটিস স্ট্রিক ও লিডারবোর্ড এক্সপি (XP)।',
              ],
            ),
            const SizedBox(height: 14),

            _PolicyCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.lock,
              iconColor: const Color(0xFF10B981),
              title: '২. তথ্য যেভাবে সুরক্ষিত রাখা হয়',
              items: const [
                'সকল যোগাযোগ ও ডেটা ট্রানজেকশন SSL/TLS এনক্রিপশনের মাধ্যমে সুরক্ষিত।',
                'ইউজারের পাসওয়ার্ড আধুনিক হ্যাশিং অ্যালগরিদম (Bcrypt) দিয়ে সুরক্ষিত থাকে।',
                'Supabase এন্টারপ্রাইজ ক্লাউড স্টোরেজে কঠোর এক্সেস কন্ট্রোলে ডেটা সংরক্ষিত হয়।',
              ],
            ),
            const SizedBox(height: 14),

            _PolicyCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.shieldAlert,
              iconColor: const Color(0xFFF59E0B),
              title: '৩. কোনো থার্ড-পার্টি ডেটা শেয়ার নয়',
              items: const [
                'Obhyash কখনোই শিক্ষার্থীদের কোনো ব্যক্তিগত তথ্য তৃতীয় কোনো পক্ষের কাছে বিক্রি করে না।',
                'তথ্য শুধুমাত্র অ্যাপের ভেতর পারসোনালাইজড সাজেশন ও পরীক্ষার রিপোর্ট তৈরিতে ব্যবহৃত হয়।',
              ],
            ),
            const SizedBox(height: 14),

            _PolicyCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.image,
              iconColor: const Color(0xFF8B5CF6),
              title: '৪. ডিভাইস পারমিশন ব্যবহারের নিয়ম',
              items: const [
                'গ্যালারি পারমিশন কেবল প্রোফাইল ছবি ও অ্যাভাটার আপলোডের জন্য ব্যবহৃত হয়।',
                'অনুমতি ছাড়া ব্যাকগ্রাউন্ডে কোনো মিডিয়া বা ফাইল স্ক্যান করা হয় না।',
              ],
            ),
            const SizedBox(height: 14),

            _PolicyCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.trash2,
              iconColor: const Color(0xFFEF4444),
              title: '৫. শিক্ষার্থীর ডেটা অধিকার ও মুছার সুবিধা',
              items: const [
                'যেকোনো সময় প্রোফাইল এডিট বা ছবি পরিবর্তন করার সম্পূর্ণ স্বাধীনতা রয়েছে।',
                'চাইলে আমাদের সাপোর্টে মেসেজ দিয়ে সম্পূর্ণ অ্যাকাউন্ট ও পরীক্ষার ইতিহাস মুছে ফেলার রিকোয়েস্ট করা যায়।',
              ],
            ),
            const SizedBox(height: 24),

            // Footer
            Center(
              child: Text(
                'প্রশ্ন বা সহায়তার জন্য লিখুন: support@obhyash.com',
                style: TextStyle(
                  fontSize: 13,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _PolicyCard extends StatelessWidget {
  final Color cardBg;
  final Color borderColor;
  final bool isDark;
  final IconData icon;
  final Color iconColor;
  final String title;
  final List<String> items;

  const _PolicyCard({
    required this.cardBg,
    required this.borderColor,
    required this.isDark,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x2A000000) : const Color(0x06000000),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: isDark ? 0.18 : 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 16, color: iconColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 7, right: 8),
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      item,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.45,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
                      ),
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
