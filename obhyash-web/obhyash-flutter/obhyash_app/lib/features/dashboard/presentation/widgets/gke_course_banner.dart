import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

class GkeCourseBanner extends StatelessWidget {
  final VoidCallback? onTap;

  const GkeCourseBanner({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Semantics(
      button: true,
      label: 'মেডিকেল GKE স্পেশাল ব্যাচ কোর্স',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap ?? () => context.go('/courses'),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF18181B) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? Colors.black.withOpacity(0.3)
                      : const Color(0xFF12544F).withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Badges + Obhyash 3D Tile
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Badges row
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF12544F).withOpacity(0.28)
                                      : const Color(0xFFE6F0EC),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFF12544F).withOpacity(0.2),
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF004633),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      'মেডিকেল ব্যাচ ০১',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        fontFamily: 'HindSiliguri',
                                        color: isDark ? const Color(0xFF34D399) : const Color(0xFF004633),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'ভর্তি চলছে',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF4B5563),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF451A03).withOpacity(0.4) : const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFFF59E0B).withOpacity(0.4),
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  'শুরু ১০ নভেম্বর',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Heading
                          Text(
                            'মেডিকেল GKE স্পেশাল ব্যাচ',
                            style: TextStyle(
                              fontSize: 15.5,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? Colors.white : const Color(0xFF111827),
                              height: 1.25,
                            ),
                          ),
                          const SizedBox(height: 3),

                          // Subtitle
                          Text(
                            '২৫ নম্বরের পূর্ণাঙ্গ প্রস্তুতি • পরীক্ষা শুরু আগামী ১০ নভেম্বর',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Custom 3D Medical GKE Tile Icon
                    SizedBox(
                      width: 52,
                      height: 52,
                      child: SvgPicture.asset(
                        'assets/dashboard-icons/course_medical_gke.svg',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Bottom strip: Features + CTA button
                Row(
                  children: [
                    // Highlights
                    Expanded(
                      child: Wrap(
                        spacing: 10,
                        runSpacing: 4,
                        children: [
                          _buildFeaturePill(
                            icon: Icons.check_circle_rounded,
                            text: '২৫টি লাইভ এক্সাম',
                            isDark: isDark,
                          ),
                          _buildFeaturePill(
                            icon: Icons.description_rounded,
                            text: 'সলভ শিট',
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ),

                    // Action CTA button
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF004633),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'কোর্সটি দেখুন',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'HindSiliguri',
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(
                            Icons.arrow_forward_rounded,
                            size: 13,
                            color: Colors.white,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeaturePill({
    required IconData icon,
    required String text,
    required bool isDark,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 13,
          color: isDark ? const Color(0xFF34D399) : const Color(0xFF004633),
        ),
        const SizedBox(width: 3.5),
        Text(
          text,
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            fontFamily: 'HindSiliguri',
            color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF4B5563),
          ),
        ),
      ],
    );
  }
}

