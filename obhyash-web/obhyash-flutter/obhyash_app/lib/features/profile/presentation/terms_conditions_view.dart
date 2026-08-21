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
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
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

            // ── Terms Cards ──────────────────────────────────────────────────
            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.fileCheck,
              iconColor: const Color(0xFF10B981),
              title: '১. শর্তাবলী সম্মতি ও অ্যাকাউন্ট গাইডলাইন',
              items: const [
                'Obhyash ওয়েবসাইট বা মোবাইল অ্যাপে প্রবেশের মাধ্যমে আপনি এই ব্যবহারকারী নির্দেশিকা ও শর্তাবলীতে পূর্ণ সম্মতি প্রদান করছেন।',
                'অ্যাকাউন্ট তৈরির সময় সঠিক নাম, শিক্ষাপ্রতিষ্ঠান ও মোবাইল নম্বর প্রদান করা আবশ্যক।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.cookie,
              iconColor: const Color(0xFF06B6D4),
              title: '২. কুকিজ ও ডেটা ব্যবহার (Usage of Cookies)',
              items: const [
                'আমাদের প্ল্যাটফর্ম ব্যবহারকারীর অভিজ্ঞতা উন্নত করতে কুকিজ ও লোকাল স্টোরেজ ব্যবহার করে।',
                'Obhyash ব্যবহারের মাধ্যমে আপনি আমাদের Privacy Policy অনুযায়ী কুকিজ ব্যবহারে সম্মতি দিচ্ছেন।',
                'কুকিজের মাধ্যমে লগইন সেশন মনে রাখা এবং সাইট ও অ্যাপকে অধিকতর দ্রুত ও ইউজার-ফ্রেন্ডলি করা হয়।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.award,
              iconColor: const Color(0xFF8B5CF6),
              title: '৩. কপিরাইট ও লাইসেন্স (Copyright and Licenses)',
              items: const [
                'অন্যথায় উল্লেখিত না থাকলে, Obhyash এবং/অথবা এর লাইসেন্সদাতারা এই প্ল্যাটফর্মের সকল কনটেন্ট ও প্রশ্নব্যাংকের পূর্ণ কপিরাইট ধারণ করে।',
                'সকল মেধাস্বত্ব ও কপিরাইট সংরক্ষিত। শিক্ষার্থীদের ব্যক্তিগত শিক্ষামূলক অনুশীলনের জন্য এটি ব্যবহারের অনুমতি দেওয়া হয়।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.shieldAlert,
              iconColor: const Color(0xFFEF4444),
              title: '৪. কঠোরভাবে নিষিদ্ধ কার্যক্রম (Prohibitions)',
              items: const [
                'Obhyash থেকে কোনো কনটেন্ট অনুমতি ছাড়া অন্য কোথাও পুনরায় প্রকাশ করা যাবে না।',
                'কনটেন্ট বিক্রি, ভাড়া দেওয়া, সাব-লাইসেন্স দেওয়া বা বাণিজ্যিকভাবে ব্যবহার করা সম্পূর্ণ নিষিদ্ধ।',
                'কোনো কনটেন্ট নকল (Duplicate), কপি বা অননুমোদিতভাবে রি-ডিস্ট্রিবিউট করা নিষিদ্ধ।',
                'অটোমেটেড স্ক্র্যাপিং, বট চালানো বা সিস্টেমে অননুমোদিত অ্যাক্সেসের চেষ্টা করা কঠোরভাবে নিষিদ্ধ।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.userCheck,
              iconColor: const Color(0xFFF59E0B),
              title: '৫. ফেয়ার ইউজ পলিসি (Fair Use Policy)',
              items: const [
                'ব্যবহারকারীদের অবশ্যই আমাদের ফেয়ার ইউজ পলিসি মেনে চলতে হবে এবং প্ল্যাটফর্মটি শুধুমাত্র ব্যক্তিগত অনুশীলনে ব্যবহার করতে হবে।',
                'আইডি-পাসওয়ার্ড অন্যান্য শিক্ষার্থীদের সাথে গ্রুপ শেয়ার করা বা বিক্রি করা কঠোরভাবে নিষিদ্ধ।',
                'ফেয়ার ইউজ পলিসি লঙ্ঘন করলে অ্যাকাউন্ট সাময়িক স্থগিত বা স্থায়ীভাবে ব্যান করা হতে পারে।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.zap,
              iconColor: const Color(0xFF10B981),
              title: '৬. সার্ভিস ডেলিভারি টাইম (Delivery Time)',
              items: const [
                'পেমেন্ট সম্পন্ন ও যাচাই হওয়ার সাথে সাথে ব্যবহারকারী তাত্ক্ষণিকভাবে নির্বাচিত প্রিমিয়াম প্ল্যানের সকল ফিচার ও এক্সেস পেয়ে যাবেন।',
                'Obhyash-এ কোনো অনাকাঙ্ক্ষিত অটো-রিনিউয়াল নেই। সাবস্ক্রিপশনের মেয়াদ শেষ হলে অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে ফ্রি প্ল্যানে চলে আসবে।',
              ],
            ),
            const SizedBox(height: 14),

            _TermsCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.scale,
              iconColor: const Color(0xFF6366F1),
              title: '৭. কনটেন্টের নির্ভরযোগ্যতা ও দায়বদ্ধতা',
              items: const [
                'Obhyash প্ল্যাটফর্মে প্রশ্ন ও তথ্যের সর্বোচ্চ নির্ভুলতা ও মান বজায় রাখার জন্য সার্বক্ষণিক আন্তরিক চেষ্টা করা হয়।',
                'প্রযোজ্য আইনের আওতায় প্ল্যাটফর্মের টেকনিক্যাল আধুনিকায়ন, নিরাপত্তা ও নিয়মিত আপডেট অব্যাহত থাকে।',
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
