import 'dart:async';
import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
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
    with TickerProviderStateMixin {
  late final ConfettiController _confettiController;
  late final AnimationController _entranceController;
  late final AnimationController _xpCounterController;
  late final AnimationController _achievementController;

  late final Animation<double> _scaleAnimation;
  late final Animation<double> _fadeAnimation;
  late final Animation<int> _xpAnimation;
  late final Animation<double> _achievementScaleAnim;

  Timer? _autoTransitionTimer;
  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();

    final result = widget.result;
    final xpEarned =
        (result.correctCount * 10 - result.wrongCount * 2).clamp(0, 9999);

    // Confetti
    _confettiController =
        ConfettiController(duration: const Duration(milliseconds: 3200));
    _confettiController.play();

    // Entrance Animation (Card Pop & Scale)
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _scaleAnimation = CurvedAnimation(
      parent: _entranceController,
      curve: Curves.easeOutBack,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _entranceController,
      curve: Curves.easeIn,
    );

    // Live Counting XP Animation
    _xpCounterController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    _xpAnimation = IntTween(begin: 0, end: xpEarned).animate(
      CurvedAnimation(
        parent: _xpCounterController,
        curve: Curves.easeOutCubic,
      ),
    );

    // Achievement Badge Entrance
    _achievementController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _achievementScaleAnim = CurvedAnimation(
      parent: _achievementController,
      curve: Curves.elasticOut,
    );

    // Start choreographing animations
    _entranceController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) {
        _xpCounterController.forward();
      }
    });
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        _achievementController.forward();
      }
    });

    // Auto-transition to ResultView after extended celebration duration (4.8 seconds)
    _autoTransitionTimer = Timer(const Duration(milliseconds: 4800), () {
      _navigateToResult();
    });
  }

  void _navigateToResult() {
    if (_hasNavigated || !mounted) return;
    _hasNavigated = true;
    _autoTransitionTimer?.cancel();

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => ResultView(
          result: widget.result,
          onRestart: widget.onRestart,
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeInOut),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 400),
      ),
    );
  }

  @override
  void dispose() {
    _autoTransitionTimer?.cancel();
    _confettiController.dispose();
    _entranceController.dispose();
    _xpCounterController.dispose();
    _achievementController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final result = widget.result;

    final skippedCount = (result.totalQuestions -
            result.correctCount -
            result.wrongCount)
        .clamp(0, result.totalQuestions);

    final percentage = result.totalMarks > 0
        ? ((result.score / result.totalMarks) * 100).clamp(0, 100)
        : 0.0;

    // Check potential unlocked achievement
    final String? unlockedAchievement = percentage >= 100
        ? 'পারফেক্ট স্কোর (১০০%)'
        : percentage >= 80
            ? '৮০%+ এক্সিলেন্স ব্যাজ'
            : result.correctCount >= 10
                ? '১০টি সঠিক উত্তর কমপ্লিট'
                : null;

    final bgColor = isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC);
    final cardBg = isDark ? const Color(0xFF141417) : Colors.white;
    final cardBorder =
        isDark ? const Color(0xFF24242A) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);

    return Scaffold(
      backgroundColor: bgColor,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _navigateToResult,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Ambient glow in background
            Positioned(
              top: MediaQuery.of(context).size.height * 0.2,
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF059669)
                      .withValues(alpha: isDark ? 0.12 : 0.08),
                ),
              ),
            ),

            // Main Content
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: ScaleTransition(
                      scale: _scaleAnimation,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // ── 1. XP LIVE COUNT CHAMBER ──
                          Container(
                            padding: const EdgeInsets.symmetric(
                                vertical: 26, horizontal: 20),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isDark
                                    ? [
                                        const Color(0xFF003828),
                                        const Color(0xFF091E16)
                                      ]
                                    : [
                                        const Color(0xFFE8F9F3),
                                        const Color(0xFFF0FDF7)
                                      ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: const Color(0xFF34D399)
                                    .withValues(alpha: isDark ? 0.35 : 0.45),
                                width: 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF059669).withValues(
                                      alpha: isDark ? 0.35 : 0.12),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                Text(
                                  'XP রিওয়ার্ড অর্জিত',
                                  style: TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark
                                        ? const Color(0xFF34D399)
                                        : const Color(0xFF004633),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 8),

                                // Live Animated Counter
                                AnimatedBuilder(
                                  animation: _xpAnimation,
                                  builder: (context, child) {
                                    return Text(
                                      '+${BanglaNameHelper.toBanglaNumeral(_xpAnimation.value)} XP',
                                      style: TextStyle(
                                        fontSize: 46,
                                        fontWeight: FontWeight.w900,
                                        fontFamily: 'HindSiliguri',
                                        color: isDark
                                            ? Colors.white
                                            : const Color(0xFF004633),
                                        height: 1.1,
                                      ),
                                    );
                                  },
                                ),
                                const SizedBox(height: 6),

                                Text(
                                  '${BanglaNameHelper.toBanglaNumeral(result.correctCount)}টি সঠিক (+${BanglaNameHelper.toBanglaNumeral(result.correctCount * 10)}) · ${BanglaNameHelper.toBanglaNumeral(result.wrongCount)}টি ভুল (-${BanglaNameHelper.toBanglaNumeral(result.wrongCount * 2)})',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w500,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark
                                        ? Colors.white70
                                        : const Color(0xFF065F46),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // ── 2. RESULT SUMMARY: 3 CARDS IN A SINGLE ROW (NO ICONS) ──
                          Row(
                            children: [
                              // Correct Card
                              _buildMetricCard(
                                label: 'সঠিক',
                                count: BanglaNameHelper.toBanglaNumeral(
                                    result.correctCount),
                                accentColor: isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF059669),
                                cardBg: cardBg,
                                cardBorder: cardBorder,
                                textPrimary: textPrimary,
                                isDark: isDark,
                              ),
                              const SizedBox(width: 10),

                              // Wrong Card
                              _buildMetricCard(
                                label: 'ভুল',
                                count: BanglaNameHelper.toBanglaNumeral(
                                    result.wrongCount),
                                accentColor: const Color(0xFFEF4444),
                                cardBg: cardBg,
                                cardBorder: cardBorder,
                                textPrimary: textPrimary,
                                isDark: isDark,
                              ),
                              const SizedBox(width: 10),

                              // Skipped Card
                              _buildMetricCard(
                                label: 'ছেড়ে দেওয়া',
                                count: BanglaNameHelper.toBanglaNumeral(
                                    skippedCount),
                                accentColor: isDark
                                    ? const Color(0xFFA1A1AA)
                                    : const Color(0xFF64748B),
                                cardBg: cardBg,
                                cardBorder: cardBorder,
                                textPrimary: textPrimary,
                                isDark: isDark,
                              ),
                            ],
                          ),

                          // ── 3. UNLOCKED ACHIEVEMENT CELEBRATION (ANIMATED) ──
                          if (unlockedAchievement != null) ...[
                            const SizedBox(height: 18),
                            ScaleTransition(
                              scale: _achievementScaleAnim,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    vertical: 12, horizontal: 16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF59E0B).withValues(
                                      alpha: isDark ? 0.14 : 0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: const Color(0xFFF59E0B).withValues(
                                        alpha: isDark ? 0.4 : 0.35),
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      '🎉 নতুন অর্জন আনলকড: $unlockedAchievement',
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w800,
                                        fontFamily: 'HindSiliguri',
                                        color: isDark
                                            ? const Color(0xFFFDE68A)
                                            : const Color(0xFFB45309),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Top Confetti Cannon
            Align(
              alignment: Alignment.topCenter,
              child: ConfettiWidget(
                confettiController: _confettiController,
                blastDirectionality: BlastDirectionality.explosive,
                shouldLoop: false,
                colors: const [
                  Color(0xFF059669),
                  Color(0xFF34D399),
                  Color(0xFFF59E0B),
                  Color(0xFF3B82F6),
                  Color(0xFF8B5CF6),
                ],
                numberOfParticles: 35,
                gravity: 0.25,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String label,
    required String count,
    required Color accentColor,
    required Color cardBg,
    required Color cardBorder,
    required Color textPrimary,
    required bool isDark,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Text(
              count,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                fontFamily: 'HindSiliguri',
                color: accentColor,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                fontFamily: 'HindSiliguri',
                color: isDark ? Colors.white70 : const Color(0xFF475569),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
