import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

class SupportView extends StatelessWidget {
  const SupportView({super.key});

  Future<void> _launchUrl(BuildContext context, String urlString) async {
    final uri = Uri.parse(urlString);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('লিঙ্কটি খুলতে সমস্যা হচ্ছে')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('ত্রুটি: $e')),
        );
      }
    }
  }

  void _copyToClipboard(BuildContext context, String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label কপি করা হয়েছে'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF09090B) : const Color(0xFFF9FAFB);

    return Scaffold(
      backgroundColor: bgColor,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Top Support Banner with 3D Button ─────────────────────────────
            _buildTopSupportBanner(context, isDark),

            const SizedBox(height: 24),

            // ── Section Title: সরাসরি যোগাযোগ ────────────────────────────────
            Text(
              'সরাসরি যোগাযোগের মাধ্যম',
              style: TextStyle(
                fontSize: 16.5,
                fontWeight: FontWeight.w700,
                color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF1E293B),
                letterSpacing: -0.2,
              ),
            ),
            const SizedBox(height: 12),

            // ── WhatsApp Card ────────────────────────────────────────────────
            _buildContactCard(
              context: context,
              isDark: isDark,
              icon: LucideIcons.messageCircle,
              iconBgColor: const Color(0xFF25D366).withValues(alpha: isDark ? 0.2 : 0.12),
              iconColor: const Color(0xFF25D366),
              title: 'হোয়াটসঅ্যাপ হেল্পলাইন',
              detailText: '+880 1409-583992',
              description: 'তাত্ক্ষণিক মেসেজ ও সরাসরি চ্যাট সাপোর্টের জন্য ট্যাপ করো',
              buttonText: 'মেসেজ দিন',
              onTap: () => _launchUrl(
                context,
                'https://wa.me/8801409583992?text=আসসালামু%20আলাইকুম,%20Obhyash%20সাপোর্ট%20প্রয়োজন',
              ),
              onCopy: () => _copyToClipboard(context, '+8801409583992', 'হোয়াটসঅ্যাপ নম্বর'),
            ),

            const SizedBox(height: 12),

            // ── Email Support Card ───────────────────────────────────────────
            _buildContactCard(
              context: context,
              isDark: isDark,
              icon: LucideIcons.mail,
              iconBgColor: const Color(0xFF3B82F6).withValues(alpha: isDark ? 0.2 : 0.12),
              iconColor: const Color(0xFF3B82F6),
              title: 'ইমেইল সাপোর্ট',
              detailText: 'support@obhyash.com',
              description: 'অফিসিয়াল যোগাযোগ, ফিডব্যাক বা যেকোনো বিষয়ে মেইল পাঠাও',
              buttonText: 'মেইল পাঠান',
              onTap: () => _launchUrl(context, 'mailto:support@obhyash.com'),
              onCopy: () => _copyToClipboard(context, 'support@obhyash.com', 'ইমেইল অ্যাড্রেস'),
            ),

            const SizedBox(height: 12),

            // ── In-App Complaint Box Card ────────────────────────────────────
            _buildContactCard(
              context: context,
              isDark: isDark,
              icon: LucideIcons.messageSquare,
              iconBgColor: const Color(0xFF059669).withValues(alpha: isDark ? 0.2 : 0.12),
              iconColor: const Color(0xFF059669),
              title: 'অভিযোগ ও মতামত বক্স',
              detailText: 'ইন-অ্যাপ কমপ্লেইন ফর্ম',
              description: 'অ্যাপের কোনো বাগ বা সমস্যা সরাসরি অ্যাডমিন টিমের কাছে পাঠাও',
              buttonText: 'অভিযোগ জানান',
              onTap: () => context.push('/profile/complaint'),
            ),

            const SizedBox(height: 20),

            // ── Support Hours Notice Card ────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: isDark ? 0.2 : 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.clock,
                      color: Color(0xFFF59E0B),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'সাপোর্ট সেবা সময়',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'প্রতিদিন সকাল ১০:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত (গড়ে ৫-১৫ মিনিটে রেসপন্স)',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── Link to FAQ Page Card ────────────────────────────────────────
            InkWell(
              onTap: () => context.push('/profile/faq'),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: isDark
                      ? const LinearGradient(
                          colors: [Color(0xFF13201B), Color(0xFF18181B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : const LinearGradient(
                          colors: [Color(0xFFECFDF5), Color(0xFFF8FAFC)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF059669).withValues(alpha: isDark ? 0.35 : 0.25),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669).withValues(alpha: isDark ? 0.25 : 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.helpCircle,
                        color: Color(0xFF10B981),
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'সাধারণ জিজ্ঞাসা (FAQ)',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'পরীক্ষা, ওএমআর ও প্রিমিয়াম সংক্রান্ত ১৬+ প্রশ্নের উত্তর',
                            style: TextStyle(
                              fontSize: 12.5,
                              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      LucideIcons.arrowRight,
                      size: 18,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }

  Widget _buildTopSupportBanner(BuildContext context, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF111C2E) : const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? const Color(0xFF1E3A8A).withValues(alpha: 0.5)
              : const Color(0xFFDBEAFE),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withValues(alpha: isDark ? 0.08 : 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left side: Text & 3D Button
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'কোনো বিষয়ে সাহায্য দরকার?',
                  style: TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 14),
                // Deepest green 3D button
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.push('/login-support');
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF047857), // Deepest green
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0xFF065F46), // 3D depth bottom border
                          offset: Offset(0, 3),
                          blurRadius: 0,
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: const Text(
                      'সাপোর্টে যোগাযোগ করো',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // Right side: Headphone illustration with soft cloud glow
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? const Color(0xFF1E3A8A).withValues(alpha: 0.35)
                      : const Color(0xFFBFDBFE).withValues(alpha: 0.6),
                ),
              ),
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Center(
                  child: Icon(
                    LucideIcons.headphones,
                    size: 30,
                    color: Color(0xFF2563EB), // Deep blue icon
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContactCard({
    required BuildContext context,
    required bool isDark,
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required String title,
    required String detailText,
    required String description,
    required String buttonText,
    required VoidCallback onTap,
    VoidCallback? onCopy,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x1A000000) : const Color(0x06000000),
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
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      detailText,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: iconColor,
                      ),
                    ),
                  ],
                ),
              ),
              if (onCopy != null)
                IconButton(
                  onPressed: onCopy,
                  icon: const Icon(LucideIcons.copy, size: 18),
                  tooltip: 'কপি করুন',
                  color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: TextStyle(
              fontSize: 12.5,
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          // Action button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onTap,
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: iconColor.withValues(alpha: 0.5)),
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                buttonText,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: iconColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
