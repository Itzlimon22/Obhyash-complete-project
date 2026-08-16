import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../domain/exam_models.dart';
import 'result_view.dart';

class ExamCelebrationView extends StatefulWidget {
  final ExamResult result;
  final VoidCallback onRestart;

  const ExamCelebrationView({
    super.key,
    required this.result,
    required this.onRestart,
  });

  @override
  State<ExamCelebrationView> createState() => _ExamCelebrationViewState();
}

class _ExamCelebrationViewState extends State<ExamCelebrationView>
    with SingleTickerProviderStateMixin {
  late final ConfettiController _confettiController;
  late final AnimationController _animController;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _confettiController =
        ConfettiController(duration: const Duration(seconds: 3));
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _scaleAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.elasticOut,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeIn,
    );

    // Play confetti and entrance animation
    _confettiController.play();
    _animController.forward();
  }

  @override
  void dispose() {
    _confettiController.dispose();
    _animController.dispose();
    super.dispose();
  }

  String _toBn(dynamic n) {
    const m = {
      '0': '০',
      '1': '১',
      '2': '২',
      '3': '৩',
      '4': '৪',
      '5': '৫',
      '6': '৬',
      '7': '৭',
      '8': '৮',
      '9': '৯',
      '.': '.',
    };
    return n.toString().split('').map((c) => m[c] ?? c).join('');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final result = widget.result;

    final xpEarned =
        (result.correctCount * 10 - result.wrongCount * 2).clamp(0, 9999);
    final percentage = result.totalMarks > 0
        ? ((result.score / result.totalMarks) * 100).clamp(0, 100)
        : 0.0;

    // Determine titles & icons
    final String headline;
    final String subtitle;
    final Color badgeColor;
    final IconData badgeIcon;

    if (percentage >= 80) {
      headline = 'অসাধারণ পারফরম্যান্স!';
      subtitle = 'তুমি দারুণভাবে পরীক্ষায় উত্তীর্ণ হয়েছ!';
      badgeColor = const Color(0xFF004633);
      badgeIcon = LucideIcons.trophy;
    } else if (percentage >= 50) {
      headline = 'দারুণ চেষ্টা!';
      subtitle = 'ভালো করেছো! নিয়মিত প্র্যাকটিসে আরও উন্নতি হবে।';
      badgeColor = const Color(0xFFD97706);
      badgeIcon = LucideIcons.award;
    } else {
      headline = 'প্র্যাকটিস চালিয়ে যাও!';
      subtitle = 'ভুলগুলো থেকে শেখো এবং আবার চেষ্টা করো।';
      badgeColor = const Color(0xFF2563EB);
      badgeIcon = LucideIcons.sparkles;
    }

    // Dynamic Achievements
    final List<Map<String, dynamic>> achievements = [];

    if (result.correctCount == result.totalQuestions &&
        result.totalQuestions > 0) {
      achievements.add({
        'icon': LucideIcons.crown,
        'color': const Color(0xFFEAB308),
        'title': 'পারফেক্ট স্কোর!',
        'desc': 'সবকটি প্রশ্নের শতভাগ নির্ভুল উত্তর দিয়েছো',
      });
    }

    if (percentage >= 80) {
      achievements.add({
        'icon': LucideIcons.target,
        'color': const Color(0xFF004633),
        'title': 'শার্প শুটার',
        'desc': '${_toBn(percentage.round())}% নির্ভুলতা অর্জন',
      });
    }

    achievements.add({
      'icon': LucideIcons.flame,
      'color': const Color(0xFFEA580C),
      'title': 'ডেইলি স্ট্রিক সুরক্ষিত',
      'desc': 'আজকের ধারাবাহিকতা বজায় রয়েছে',
    });

    if (result.timeTaken > 0 && result.timeTaken < 180) {
      achievements.add({
        'icon': LucideIcons.zap,
        'color': const Color(0xFF8B5CF6),
        'title': 'ক্ষিপ্র উত্তরদাতা',
        'desc': 'খুব দ্রুত পরীক্ষা সম্পন্ন করেছো',
      });
    }

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0D0D0D) : const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Background subtle ambient glow
          Positioned(
            top: -60,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF004633).withValues(alpha: isDark ? 0.25 : 0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Animated Hero Badge
                        ScaleTransition(
                          scale: _scaleAnimation,
                          child: Container(
                            width: 88,
                            height: 88,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [
                                  badgeColor,
                                  badgeColor.withValues(alpha: 0.8),
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: badgeColor.withValues(alpha: 0.35),
                                  blurRadius: 24,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Icon(
                                badgeIcon,
                                size: 44,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Headlines
                        FadeTransition(
                          opacity: _fadeAnimation,
                          child: Column(
                            children: [
                              Text(
                                headline,
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark ? Colors.white : const Color(0xFF111827),
                                ),
                                textAlign: TextAlign.center,
                              ),
                              Text(
                                subtitle,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF6B7280),
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF3F4F6),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      LucideIcons.bookOpen,
                                      size: 13,
                                      color: Color(0xFF004633),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      BanglaNameHelper.formatSubject(result.subject, result.subjectLabel),
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'HindSiliguri',
                                        color: isDark ? Colors.white : const Color(0xFF1F2937),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // XP Earned Celebration Card
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isDark
                                  ? [const Color(0xFF1A2E26), const Color(0xFF141F1B)]
                                  : [const Color(0xFFE8F5EE), const Color(0xFFF0FDF4)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF004633).withValues(alpha: isDark ? 0.35 : 0.2),
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF004633).withValues(alpha: isDark ? 0.2 : 0.06),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF004633),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(
                                      LucideIcons.sparkles,
                                      size: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'XP রিওয়ার্ড অর্জিত!',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'HindSiliguri',
                                      color: isDark ? Colors.white : const Color(0xFF004633),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    '+${_toBn(xpEarned)}',
                                    style: const TextStyle(
                                      fontSize: 34,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF004633),
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'XP',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: isDark ? Colors.white70 : const Color(0xFF004633),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                '${_toBn(result.correctCount)}টি সঠিক (+${_toBn(result.correctCount * 10)} XP) · ${_toBn(result.wrongCount)}টি ভুল (-${_toBn(result.wrongCount * 2)} XP)',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF4B5563),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Quick Stats Grid
                        Row(
                          children: [
                            _buildStatItem(
                              label: 'স্কোর',
                              value: '${_toBn(result.score.toStringAsFixed(1))}/${_toBn(result.totalMarks)}',
                              icon: LucideIcons.checkCircle2,
                              color: const Color(0xFF004633),
                              isDark: isDark,
                            ),
                            const SizedBox(width: 8),
                            _buildStatItem(
                              label: 'সঠিক',
                              value: _toBn(result.correctCount),
                              icon: LucideIcons.check,
                              color: const Color(0xFF10B981),
                              isDark: isDark,
                            ),
                            const SizedBox(width: 8),
                            _buildStatItem(
                              label: 'ভুল',
                              value: _toBn(result.wrongCount),
                              icon: LucideIcons.x,
                              color: const Color(0xFFEF4444),
                              isDark: isDark,
                            ),
                            const SizedBox(width: 8),
                            _buildStatItem(
                              label: 'সময়',
                              value: '${_toBn(result.timeTaken ~/ 60)}ম ${_toBn(result.timeTaken % 60)}স',
                              icon: LucideIcons.timer,
                              color: const Color(0xFF6366F1),
                              isDark: isDark,
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),

                        // Achievements List
                        if (achievements.isNotEmpty) ...[
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'অর্জিত ব্যাজ ও মাইলফলক',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white : const Color(0xFF1F2937),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          ...achievements.map((ach) => Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: (ach['color'] as Color).withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(
                                        ach['icon'] as IconData,
                                        size: 18,
                                        color: ach['color'] as Color,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            ach['title'] as String,
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                              fontFamily: 'HindSiliguri',
                                              color: isDark ? Colors.white : const Color(0xFF111827),
                                            ),
                                          ),
                                          Text(
                                            ach['desc'] as String,
                                            style: TextStyle(
                                              fontSize: 11.5,
                                              fontFamily: 'HindSiliguri',
                                              color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF6B7280),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              )),
                        ],
                      ],
                    ),
                  ),
                ),

                // Bottom Fixed Actions
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF121212) : Colors.white,
                    border: Border(
                      top: BorderSide(
                        color: isDark ? const Color(0xFF222222) : const Color(0xFFE5E7EB),
                      ),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Primary Button: View Solutions & Explanations
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute(
                                builder: (_) => ResultView(
                                  result: widget.result,
                                  onRestart: widget.onRestart,
                                ),
                              ),
                            );
                          },
                          icon: const Icon(LucideIcons.fileText, size: 18, color: Colors.white),
                          label: const Text(
                            'উত্তরমালা ও ব্যাখ্যা দেখুন',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Colors.white,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF004633),
                            elevation: 2,
                            shadowColor: const Color(0xFF004633).withValues(alpha: 0.35),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Secondary Button: Back to Dashboard
                      SizedBox(
                        width: double.infinity,
                        height: 42,
                        child: TextButton.icon(
                          onPressed: () {
                            Navigator.of(context, rootNavigator: true)
                                .popUntil((route) => route.isFirst);
                            context.go('/dashboard');
                          },
                          icon: Icon(
                            LucideIcons.home,
                            size: 16,
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFF4B5563),
                          ),
                          label: Text(
                            'ড্যাশবোর্ডে ফিরে যাও',
                            style: TextStyle(
                              fontSize: 13.5,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF4B5563),
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

          // Confetti Blast Animation on Top
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              shouldLoop: false,
              colors: const [
                Color(0xFF004633),
                Color(0xFF10B981),
                Color(0xFFF59E0B),
                Color(0xFF3B82F6),
                Color(0xFFEC4899),
              ],
              numberOfParticles: 35,
              gravity: 0.25,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE5E7EB),
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF111827),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
