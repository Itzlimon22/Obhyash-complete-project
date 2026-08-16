import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class TermsConditionsView extends StatelessWidget {
  const TermsConditionsView({super.key});

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
                        colors: [Color(0xFF1A2228), Color(0xFF101518)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : const LinearGradient(
                        colors: [Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: const Color(0xFF0284C7).withValues(alpha: isDark ? 0.35 : 0.2),
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0284C7).withValues(alpha: isDark ? 0.12 : 0.06),
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
                      color: const Color(0xFF0284C7).withValues(alpha: isDark ? 0.25 : 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF0284C7).withValues(alpha: 0.4),
                        width: 1.5,
                      ),
                    ),
                    child: const Center(
                      child: Icon(
                        LucideIcons.scale,
                        color: Color(0xFF38BDF8),
                        size: 28,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'ব্যবহারের শর্তাবলী',
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
                    'Obhyash প্ল্যাটফর্ম ও মোবাইল অ্যাপ ব্যবহারের সার্বিক নীতিমালা ও নিয়মাবলী।',
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
                      'নিয়মাবলি কার্যকর: ২০২৩-২০২৬',
                      style: TextStyle(
                        fontSize: 11.5,
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

            // ── Terms Cards ──────────────────────────────────────────────────
            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.fileCheck,
              iconColor: const Color(0xFF10B981),
              title: '১. শর্তাবলী সম্মতি ও অ্যাকাউন্ট তৈরি',
              items: const [
                'Obhyash অ্যাপে রেজিস্ট্রেশন করার মাধ্যমে আপনি আমাদের শর্তাবলীর সাথে সম্মত হচ্ছেন।',
                'অ্যাকাউন্ট তৈরির সময় সঠিক নাম, শিক্ষাপ্রতিষ্ঠান ও মোবাইল নম্বর প্রদান করা আবশ্যক।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.userX,
              iconColor: const Color(0xFFEF4444),
              title: '২. অ্যাকাউন্ট ফেয়ার ইউজ ও শেয়ারিং পলিসি',
              items: const [
                'একটি অ্যাকাউন্ট শুধুমাত্র একজন একক শিক্ষার্থীর ব্যক্তিগত অনুশীলনের জন্য প্রযোজ্য।',
                'আইডি-পাসওয়ার্ড অন্যান্য শিক্ষার্থীদের সাথে গ্রুপ শেয়ার করা বা বিক্রি করা কঠোরভাবে নিষিদ্ধ।',
                'একই সাথে একাধিক অপরিচিত ডিভাইস থেকে অস্বাভাবিক লগইন লক্ষ্য করলে অ্যাকাউন্ট সাময়িক লক হতে পারে।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.creditCard,
              iconColor: const Color(0xFFF59E0B),
              title: '৩. সাবস্ক্রিপশন ও পেমেন্ট নিয়ম',
              items: const [
                'প্রিমিয়াম প্ল্যান ক্রয়ের সাথে সাথে নির্ধারিত মেয়াদের (যেমন: ৩০ দিন, ৯০ দিন) জন্য আনলিমিটেড এক্সেস সক্রিয় হবে।',
                'Obhyash-এ কোনো অটোমেটিক অটো-রিনিউয়াল নেই। মেয়াদ শেষ হলে স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে চলে আসবে।',
                'ভুল নম্বরে টাকা পাঠানো বা ভুল TrxID সাবমিট করলে ভেরিফিকেশনে বিলম্ব হতে পারে।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.award,
              iconColor: const Color(0xFF8B5CF6),
              title: '৪. মেধাস্বত্ব ও কনটেন্ট কপিরাইট',
              items: const [
                'অ্যাপের সকল প্রশ্নব্যাংক, ব্যাখ্যা, ওএমআর স্ক্যানার প্রযুক্তি ও গ্রাফিক্স Obhyash-এর নিজস্ব মেধাস্বত্ব।',
                'অনুমতি ছাড়া কোনো কনটেন্ট বাণিজ্যিক কাজে ব্যবহার, প্রিন্ট বা পাইরেসি করা আইনত দণ্ডনীয়।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.alertTriangle,
              iconColor: const Color(0xFFE11D48),
              title: '৫. অ্যাকাউন্ট স্থগিতকরণ (Termination)',
              items: const [
                'প্ল্যাটফর্মের কোনো টেকনিক্যাল ত্রুটি বা হ্যাকিংয়ের অপব্যবহার করলে তাত্ক্ষণিক অ্যাকাউন্ট ব্যান করা হবে।',
                'সাপোর্টে কোনো প্রকার অসদাচরণ বা ফেক ক্লেইম করলে লিগ্যাল অ্যাকশন নেওয়া হতে পারে।',
              ],
            ),
            const SizedBox(height: 24),

            // Footer
            Center(
              child: Text(
                'শর্ত সংক্রান্ত যেকোনো প্রয়োজনে: support@obhyash.com',
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

class _TermsCard extends StatelessWidget {
  final Color cardBg;
  final Color borderColor;
  final bool isDark;
  final IconData icon;
  final Color iconColor;
  final String title;
  final List<String> items;

  const _TermsCard({
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
                      color: const Color(0xFF0284C7),
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
