import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

class MockExamLimitScreen extends StatelessWidget {
  const MockExamLimitScreen({super.key});

  /// Opens the Mock Exam Limit Screen as a full-screen modal
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: true,
      builder: (ctx) => const MockExamLimitScreen(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F1117) : Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top Navigation Bar: Back on left, Close on right ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back Arrow Button
                  InkWell(
                    onTap: () => Navigator.of(context).pop(),
                    borderRadius: BorderRadius.circular(22),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E2230) : const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? const Color(0xFF2A2F42) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        LucideIcons.arrowLeft,
                        size: 18,
                        color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                      ),
                    ),
                  ),

                  // Close Button
                  InkWell(
                    onTap: () => Navigator.of(context).pop(),
                    borderRadius: BorderRadius.circular(22),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E2230) : const Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? const Color(0xFF2A2F42) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Icon(
                        LucideIcons.x,
                        size: 18,
                        color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Scrollable Body Matching Screenshot 1:1 ──
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 6.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 10),

                    // 1. Stylized 3D Pencil Exam Illustration Card with (!) badge
                    _buildPencilIllustrationBadge(isDark),

                    const SizedBox(height: 18),

                    // 2. Pill Badge: "মক টেস্ট লিমিট শেষ"
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF381519) : const Color(0xFFFFF0F0),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF5C1D24) : const Color(0xFFFFD4D4),
                        ),
                      ),
                      child: const Text(
                        'মক টেস্ট লিমিট শেষ',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFE11D48),
                        ),
                      ),
                    ),

                    const SizedBox(height: 14),

                    // 3. Main Headlines:
                    // "আনলিমিটেড মক টেস্ট"
                    // "মাত্র একটি সাবস্ক্রিপশনে"
                    Text(
                      'আনলিমিটেড মক টেস্ট',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 27,
                        fontWeight: FontWeight.w900,
                        color: primaryTextColor,
                        letterSpacing: -0.3,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'মাত্র একটি সাবস্ক্রিপশনে',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                        color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                        height: 1.25,
                      ),
                    ),

                    const SizedBox(height: 14),

                    // 4. Ambient Glow with "সাথে আরো থাকবে" Subtitle
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        // Soft ambient pinkish glow (matches the background gradient in screenshot)
                        Container(
                          width: 220,
                          height: 36,
                          decoration: BoxDecoration(
                            gradient: RadialGradient(
                              colors: [
                                (isDark ? const Color(0xFFBE123C) : const Color(0xFFFFD1D6))
                                    .withValues(alpha: 0.45),
                                Colors.transparent,
                              ],
                              radius: 0.85,
                            ),
                          ),
                        ),
                        Text(
                          'সাথে আরো থাকবে',
                          style: TextStyle(
                            fontFamily: 'HindSiliguri',
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: secondaryTextColor,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 22),

                    // 5. Four Feature Cards Matching Screenshot
                    // Feature 1: বিগত বছরসমূহের প্রশ্ন ব্যাংক
                    _buildFeatureItem(
                      isDark: isDark,
                      iconWidget: _buildGoldenParcelBox(),
                      title: 'বিগত বছরসমূহের প্রশ্ন ব্যাংক',
                      subtitle: '৫০,০০০+ প্রশ্ন ও নির্ভুল ব্যাখ্যা ডাটাবেজ',
                      primaryTextColor: primaryTextColor,
                      secondaryTextColor: secondaryTextColor,
                    ),

                    const SizedBox(height: 18),

                    // Feature 2: আনলিমিটেড পরীক্ষা ও ব্যাখ্যা
                    _buildFeatureItem(
                      isDark: isDark,
                      iconWidget: _buildInfinityBox(),
                      title: 'আনলিমিটেড পরীক্ষা ও ব্যাখ্যা',
                      subtitle: 'প্র্যাকটিসের মাধ্যমে নিজেকে পূর্ণাঙ্গ তৈরি করো...',
                      primaryTextColor: primaryTextColor,
                      secondaryTextColor: secondaryTextColor,
                    ),

                    const SizedBox(height: 18),

                    // Feature 3: AI অ্যাসিস্টেন্ট ও ডাউট সলভার
                    _buildFeatureItem(
                      isDark: isDark,
                      iconWidget: _buildAiBotBox(),
                      title: 'AI অ্যাসিস্টেন্ট ও ডাউট সলভার',
                      subtitle: 'যেকোনো প্রশ্নের স্মার্ট ব্যাখ্যা ও সমাধান',
                      primaryTextColor: primaryTextColor,
                      secondaryTextColor: secondaryTextColor,
                    ),

                    const SizedBox(height: 18),

                    // Feature 4: লাইভ উইকলি মডেল টেস্ট
                    _buildFeatureItem(
                      isDark: isDark,
                      iconWidget: _buildWeeklyExamBox(),
                      title: 'লাইভ উইকলি মডেল টেস্ট',
                      subtitle: 'এডমিশন ও বোর্ড স্ট্যান্ডার্ড লাইভ পরীক্ষা',
                      primaryTextColor: primaryTextColor,
                      secondaryTextColor: secondaryTextColor,
                    ),

                    const SizedBox(height: 28),
                  ],
                ),
              ),
            ),

            // ── Bottom Action Area (Customized for Obhyash) ──
            Container(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F1117) : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark ? const Color(0xFF1E2230) : const Color(0xFFF1F5F9),
                    width: 1,
                  ),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Primary CTA Button (Obhyash Signature Deep Emerald Gradient)
                  Container(
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFF004633),
                          Color(0xFF065F46),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF004633).withValues(alpha: 0.38),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/subscription');
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: const Center(
                          child: Text(
                            'অভ্যাস প্রিমিয়ামে আপগ্রেড করো',
                            style: TextStyle(
                              fontFamily: 'HindSiliguri',
                              fontSize: 16.5,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Secondary Button ("পরে করবো")
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      ),
                      child: Text(
                        'পরে করবো',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: secondaryTextColor,
                        ),
                      ),
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

  // ── Illustration: Rounded Red Card with Diagonal Pencil & Alert Badge ──
  Widget _buildPencilIllustrationBadge(bool isDark) {
    return SizedBox(
      width: 104,
      height: 104,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // Outer Rounded Card
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFFF87171),
                  Color(0xFFEF4444),
                  Color(0xFFDC2626),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(
                color: const Color(0xFFFFD5D2),
                width: 3.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Center(
              child: Transform.rotate(
                angle: -0.785398, // -45 degrees
                child: SizedBox(
                  width: 52,
                  height: 24,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Eraser tip (pink)
                      Container(
                        width: 9,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: Color(0xFFFB7185),
                          borderRadius: BorderRadius.horizontal(left: Radius.circular(5)),
                        ),
                      ),
                      // Pencil body (coral red)
                      Container(
                        width: 22,
                        height: 22,
                        color: const Color(0xFFE11D48),
                      ),
                      // Wooden Sharpened Cone (yellow)
                      CustomPaint(
                        size: const Size(14, 22),
                        painter: _PencilConePainter(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Bottom-Right Alert Badge: Circle with red border and exclamation "!"
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFFFE4E6),
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFFBE123C),
                  width: 2.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Text(
                '!',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF9F1239),
                  height: 1.1,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Feature Row Helper ──
  Widget _buildFeatureItem({
    required bool isDark,
    required Widget iconWidget,
    required String title,
    required String subtitle,
    required Color primaryTextColor,
    required Color secondaryTextColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // 48x48 Rounded Icon Box
        iconWidget,

        const SizedBox(width: 14),

        // Title and Subtitle
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 15.5,
                  fontWeight: FontWeight.w800,
                  color: primaryTextColor,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontFamily: 'HindSiliguri',
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                  color: secondaryTextColor,
                  height: 1.3,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Icon 1: Golden Parcel / Question Archive Box ──
  Widget _buildGoldenParcelBox() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD97706).withValues(alpha: 0.28),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Center(
        child: Icon(
          LucideIcons.package,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }

  // ── Icon 2: Crimson Red Infinity Box ──
  Widget _buildInfinityBox() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFB7185), Color(0xFFE11D48)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE11D48).withValues(alpha: 0.28),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Center(
        child: Icon(
          LucideIcons.infinity,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }

  // ── Icon 3: Indigo Robot AI Box ──
  Widget _buildAiBotBox() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: 0.28),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Center(
        child: Icon(
          LucideIcons.bot,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }

  // ── Icon 4: Weekly Exam Calendar Card (Pink with "WEEKLY EXAM 7") ──
  Widget _buildWeeklyExamBox() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFB7185), Color(0xFFF43F5E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF43F5E).withValues(alpha: 0.28),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Text(
            'WEEKLY',
            style: TextStyle(
              fontSize: 7,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: 0.5,
              height: 1.0,
            ),
          ),
          Text(
            'EXAM',
            style: TextStyle(
              fontSize: 6.5,
              fontWeight: FontWeight.w800,
              color: Color(0xFFFED7AA),
              height: 1.0,
            ),
          ),
          SizedBox(height: 2),
          Text(
            '7',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom painter for the sharpened pencil cone (yellow wood + black lead tip)
class _PencilConePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Yellow sharpened wood
    final woodPaint = Paint()..color = const Color(0xFFFDE68A);
    final woodPath = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, size.height / 2)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(woodPath, woodPaint);

    // Black graphite lead point
    final leadPaint = Paint()..color = const Color(0xFF1E293B);
    final leadPath = Path()
      ..moveTo(size.width * 0.55, size.height * 0.28)
      ..lineTo(size.width, size.height / 2)
      ..lineTo(size.width * 0.55, size.height * 0.72)
      ..close();
    canvas.drawPath(leadPath, leadPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
