import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutUsView extends StatelessWidget {
  const AboutUsView({super.key});

  Future<void> _launchUrl(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

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
            // ── Hero Branding Banner ─────────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
              decoration: BoxDecoration(
                gradient: isDark
                    ? const LinearGradient(
                        colors: [Color(0xFF152922), Color(0xFF0F1A15)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : const LinearGradient(
                        colors: [Color(0xFFECFDF5), Color(0xFFD1FAE5)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: const Color(0xFF059669).withValues(alpha: isDark ? 0.35 : 0.2),
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF059669).withValues(alpha: isDark ? 0.15 : 0.08),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: SizedBox(
                      width: 72,
                      height: 72,
                      child: SvgPicture.asset(
                        'assets/images/obhyash_logo.svg',
                        fit: BoxFit.cover,
                        placeholderBuilder: (_) => Image.asset(
                          'assets/images/app_logo.png',
                          width: 72,
                          height: 72,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Obhyash (অভ্যাস)',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'স্মার্ট প্রস্তুতি, নিশ্চিত সাফল্য',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.normal,
                      fontFamily: 'HindSiliguri',
                      color: Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF27272A) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Text(
                      '📱 App Version: 1.0.0 (Official)',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.normal,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ── 3 Stats Counter Row ──────────────────────────────────────────
            Row(
              children: [
                _StatBadge(
                  count: '৫০,০০০+',
                  label: 'মানসম্মত প্রশ্ন',
                  color: const Color(0xFF3B82F6),
                  isDark: isDark,
                  cardBg: cardBg,
                  borderColor: borderColor,
                ),
                const SizedBox(width: 8),
                _StatBadge(
                  count: 'বিস্তারিত',
                  label: 'ব্যাখ্যা ও ট্রিকস',
                  color: const Color(0xFF10B981),
                  isDark: isDark,
                  cardBg: cardBg,
                  borderColor: borderColor,
                ),
                const SizedBox(width: 8),
                _StatBadge(
                  count: 'তাত্ক্ষণিক',
                  label: 'মেধাতালিকা',
                  color: const Color(0xFFF59E0B),
                  isDark: isDark,
                  cardBg: cardBg,
                  borderColor: borderColor,
                ),
              ],
            ),
            const SizedBox(height: 18),

            // ── Mission & Vision ─────────────────────────────────────────────
            _InfoSectionCard(
              cardBg: cardBg,
              borderColor: borderColor,
              isDark: isDark,
              icon: LucideIcons.target,
              iconColor: const Color(0xFF059669),
              title: 'আমাদের ভিশন ও লক্ষ্য',
              description:
                  'বাংলাদেশের প্রতিটি শিক্ষার্থীর কাছে সহজ, সাশ্রয়ী ও আধুনিক পরীক্ষার পরিবেশ পৌঁছে দেওয়াই ‘অভ্যাস’-এর মূল লক্ষ্য। আমরা বিশ্বাস করি, গতানুগতিক পড়ার চেয়ে নিয়মিত সঠিক মূল্যায়ন ও স্মার্ট অনুশীলনই একজন শিক্ষার্থীকে কাঙ্ক্ষিত লক্ষ্যে পৌঁছে দেয়।',
            ),
            const SizedBox(height: 14),

            // ── Core Features Matrix ─────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: isDark ? 0.18 : 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(LucideIcons.zap, size: 16, color: Color(0xFF10B981)),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'অ্যাপের বিশেষত্বসমূহ',
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _FeatureRow(
                    icon: LucideIcons.layers,
                    title: 'কাস্টম চ্যাপ্টার ও বিষয়ভিত্তিক টেস্ট',
                    desc: 'পছন্দমতো এক বা একাধিক অধ্যায় ও সময় নির্ধারণ করে সাথে সাথে অনলাইন পরীক্ষা।',
                    isDark: isDark,
                  ),
                  _FeatureRow(
                    icon: LucideIcons.bookOpen,
                    title: 'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা',
                    desc: 'ভুল উত্তরের সঠিক লজিক, শর্টকাট ট্রিকস ও সূত্রের বিস্তারিত আলোচনা।',
                    isDark: isDark,
                  ),
                  _FeatureRow(
                    icon: LucideIcons.trophy,
                    title: 'লাইভ পরীক্ষা ও জাতীয় মেধা তালিকা',
                    desc: 'সারাদেশের শিক্ষার্থীদের সাথে একই সাথে লাইভ মডেল টেস্টে অংশগ্রহণ ও পারসেন্টাইল র‍্যাংক।',
                    isDark: isDark,
                  ),
                  _FeatureRow(
                    icon: LucideIcons.lineChart,
                    title: 'স্মার্ট পারফরম্যান্স অ্যানালিটিক্স',
                    desc: 'দুর্বল টপিক ট্র্যাকার ও বিষয়ভিত্তিক সফলতার প্রোগ্রেস গ্রাফ।',
                    isDark: isDark,
                  ),
                  _FeatureRow(
                    icon: LucideIcons.flame,
                    title: 'ডেইলি স্ট্রিক ও ফ্ল্যাশকার্ড রিভিশন',
                    desc: 'প্রতিদিনের পড়া মনে রাখার বৈজ্ঞানিক ফ্ল্যাশকার্ড ও স্ট্রিক ট্র্যাকিং।',
                    isDark: isDark,
                    isLast: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // ── Connect & Support ────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'আমাদের সাথে যোগাযোগ',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _ContactTile(
                    icon: LucideIcons.globe,
                    title: 'অফিসিয়াল ওয়েবসাইট',
                    subtitle: 'obhyash.com',
                    onTap: () => _launchUrl('https://obhyash.com'),
                    isDark: isDark,
                  ),
                  const SizedBox(height: 8),
                  _ContactTile(
                    icon: LucideIcons.mail,
                    title: 'ইমেইল সাপোর্ট',
                    subtitle: 'support@obhyash.com',
                    onTap: () => _launchUrl('mailto:support@obhyash.com'),
                    isDark: isDark,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Copyright
            Center(
              child: Column(
                children: [
                  Text(
                    '© 2026 Obhyash Technologies. All rights reserved.',
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Made with ❤️ for Bangladeshi Students',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF059669),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _StatBadge extends StatelessWidget {
  final String count;
  final String label;
  final Color color;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;

  const _StatBadge({
    required this.count,
    required this.label,
    required this.color,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Text(
              count,
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
                fontFamily: 'HindSiliguri',
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.normal,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoSectionCard extends StatelessWidget {
  final Color cardBg;
  final Color borderColor;
  final bool isDark;
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;

  const _InfoSectionCard({
    required this.cardBg,
    required this.borderColor,
    required this.isDark,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor),
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
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              height: 1.5,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final bool isDark;
  final bool isLast;

  const _FeatureRow({
    required this.icon,
    required this.title,
    required this.desc,
    required this.isDark,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            margin: const EdgeInsets.only(top: 2),
            decoration: BoxDecoration(
              color: const Color(0xFF059669).withValues(alpha: isDark ? 0.18 : 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 14, color: const Color(0xFF10B981)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.35,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool isDark;

  const _ContactTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: const Color(0xFF059669)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: 'HindSiliguri',
                      color: const Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              LucideIcons.externalLink,
              size: 14,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }
}
