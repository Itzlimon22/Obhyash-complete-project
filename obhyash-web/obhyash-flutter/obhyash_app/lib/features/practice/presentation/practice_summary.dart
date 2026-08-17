import 'dart:math';
import 'package:flutter/material.dart';
import 'flashcard_mode.dart';
import 'practice_dashboard.dart';
import 'package:lucide_icons/lucide_icons.dart';

class PracticeSummary extends StatefulWidget {
  final List<FlashcardResult> results;
  final void Function(List<PracticeQuestion>) onPracticeStruggling;
  final VoidCallback onBack;

  const PracticeSummary({
    super.key,
    required this.results,
    required this.onPracticeStruggling,
    required this.onBack,
  });

  @override
  State<PracticeSummary> createState() => _PracticeSummaryState();
}

class _PracticeSummaryState extends State<PracticeSummary>
    with TickerProviderStateMixin {
  late AnimationController _ringController;
  late Animation<double> _ringAnimation;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  late int _gotItCount;
  late int _strugglingCount;
  late int _total;
  late List<PracticeQuestion> _struggling;
  late int _percentage;

  @override
  void initState() {
    super.initState();

    _gotItCount = widget.results
        .where((r) => r.grade == FlashcardGrade.gotIt)
        .length;
    _strugglingCount = widget.results
        .where((r) => r.grade == FlashcardGrade.struggling)
        .length;
    _total = widget.results.length;
    _struggling = widget.results
        .where((r) => r.grade == FlashcardGrade.struggling)
        .map((r) => r.question)
        .toList();
    _percentage = _total > 0 ? (_gotItCount * 100 ~/ _total) : 0;

    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _ringAnimation = Tween<double>(
      begin: 0,
      end: _percentage / 100.0,
    ).animate(CurvedAnimation(parent: _ringController, curve: Curves.easeOutCubic));

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );

    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _fadeController.forward();
        _ringController.forward();
      }
    });
  }

  @override
  void dispose() {
    _ringController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  String get _feedbackTitle => _percentage >= 80
      ? 'অসাধারণ!'
      : _percentage >= 50
      ? 'ভালো প্রচেষ্টা!'
      : 'অনুশীলন শেষ!';

  String get _feedbackText => _percentage >= 80
      ? 'তুমি চমৎকার ফলাফল করেছো, চালিয়ে যাও!'
      : _percentage >= 50
      ? 'খুব কাছাকাছি! একটু জোর দিলেই আরও ভালো হবে।'
      : 'হতাশ হওয়ার কিছু নেই, আরেকবার চেষ্টা করো।';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF9FAFB),
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverFillRemaining(
                hasScrollBody: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Title & Message ─────────────────────────────────────────
                      Column(
                        children: [
                          const SizedBox(height: 12),
                          Text(
                            _feedbackTitle,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'HindSiliguri',
                              letterSpacing: -0.5,
                              color: isDark ? Colors.white : const Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _feedbackText,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.5,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),

                      const Spacer(),

                      // ── Score ring ──────────────────────────────────────────────
                      Center(
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Outer glow
                            Container(
                              width: 150,
                              height: 150,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                    blurRadius: 40,
                                    spreadRadius: 10,
                                  )
                                ],
                              ),
                            ),
                            SizedBox(
                              width: 140,
                              height: 140,
                              child: AnimatedBuilder(
                                animation: _ringAnimation,
                                builder: (context, _) => CustomPaint(
                                  painter: _ScoreRingPainter(
                                    progress: _ringAnimation.value,
                                    isDark: isDark,
                                  ),
                                ),
                              ),
                            ),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '$_percentage%',
                                  style: TextStyle(
                                    fontSize: 36,
                                    fontWeight: FontWeight.w900,
                                    height: 1.1,
                                    color: isDark ? Colors.white : const Color(0xFF111827),
                                  ),
                                ),
                                Text(
                                  'সঠিক',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const Spacer(),

                      // ── Stats grid ──────────────────────────────────────────────
                      Row(
                        children: [
                          _StatCard(
                            label: 'মোট প্রশ্ন',
                            value: _total,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF3B82F6),
                            bgColor: isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 12),
                          _StatCard(
                            label: 'পেরেছি',
                            value: _gotItCount,
                            color: const Color(0xFF10B981),
                            bgColor: isDark ? const Color(0xFF064E3B).withValues(alpha: 0.3) : const Color(0xFFECFDF5),
                            isDark: isDark,
                          ),
                          const SizedBox(width: 12),
                          _StatCard(
                            label: 'ভুল হয়েছে',
                            value: _strugglingCount,
                            color: const Color(0xFFEF4444),
                            bgColor: isDark ? const Color(0xFF7F1D1D).withValues(alpha: 0.3) : const Color(0xFFFEF2F2),
                            isDark: isDark,
                          ),
                        ],
                      ),

                      const Spacer(),

                      // ── Action buttons ──────────────────────────────────────────
                      if (_struggling.isNotEmpty)
                        GestureDetector(
                          onTap: () => widget.onPracticeStruggling(_struggling),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF059669), Color(0xFF047857)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF059669).withValues(alpha: 0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  LucideIcons.rotateCcw,
                                  size: 18,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'ভুলগুলো আবার অনুশীলন করো (${_struggling.length})',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'HindSiliguri',
                                    color: Colors.white,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      const SizedBox(height: 12),

                      GestureDetector(
                        onTap: widget.onBack,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF27272A) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                              width: 1.5,
                            ),
                            boxShadow: [
                              if (!isDark)
                                const BoxShadow(
                                  color: Color(0x0A000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 2),
                                ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              'অনুশীলনে ফিরে যাও',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'HindSiliguri',
                                color: isDark ? Colors.white : const Color(0xFF111827),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Score Ring Painter ──────────────────────────────────────────────────────

class _ScoreRingPainter extends CustomPainter {
  final double progress;
  final bool isDark;

  const _ScoreRingPainter({required this.progress, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - 16) / 2;
    const strokeWidth = 12.0;

    // Background ring
    final bgPaint = Paint()
      ..color = isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6)
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, bgPaint);

    if (progress <= 0) return;

    // Foreground arc
    final fgPaint = Paint()
      ..shader = const SweepGradient(
        colors: [Color(0xFF34D399), Color(0xFF059669)],
        startAngle: -pi / 2,
        endAngle: 3 * pi / 2,
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi * progress,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(_ScoreRingPainter old) =>
      old.progress != progress || old.isDark != isDark;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final Color bgColor;
  final bool isDark;

  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.bgColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withValues(alpha: 0.2),
            width: 1.5,
          ),
        ),
        child: Column(
          children: [
            Text(
              '$value',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                height: 1.0,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isDark ? const Color(0xFFD1D5DB) : const Color(0xFF4B5563),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
