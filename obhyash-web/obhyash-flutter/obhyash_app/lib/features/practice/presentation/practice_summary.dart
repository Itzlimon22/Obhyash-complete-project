import 'dart:math';
import 'package:flutter/material.dart';
import 'flashcard_mode.dart';
import 'practice_dashboard.dart';

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
      duration: const Duration(milliseconds: 900),
    );
    _ringAnimation = Tween<double>(
      begin: 0,
      end: _percentage / 100.0,
    ).animate(CurvedAnimation(parent: _ringController, curve: Curves.easeOut));

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
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

  String get _feedbackEmoji => _percentage >= 80
      ? '🎉'
      : _percentage >= 50
      ? '💪'
      : '📚';

  String get _feedbackText => _percentage >= 80
      ? 'দারুণ! অনুশীলন চমৎকার হয়েছে।'
      : _percentage >= 50
      ? 'ভালো প্রচেষ্টা! আরও একটু অনুশীলন করো।'
      : 'চিন্তা নেই, আবার চেষ্টা করো।';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0A0A0A)
          : const Color(0xFFF5F5F5),
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── Emoji + title ──────────────────────────────────────────
                Column(
                  children: [
                    Text(_feedbackEmoji, style: const TextStyle(fontSize: 52)),
                    const SizedBox(height: 12),
                    Text(
                      'অনুশীলন শেষ!',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF171717),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _feedbackText,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFFA3A3A3),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // ── Score ring ──────────────────────────────────────────────
                Center(
                  child: SizedBox(
                    width: 140,
                    height: 140,
                    child: AnimatedBuilder(
                      animation: _ringAnimation,
                      builder: (context, _) => CustomPaint(
                        painter: _ScoreRingPainter(
                          progress: _ringAnimation.value,
                          isDark: isDark,
                        ),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '$_percentage%',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                              ),
                              const Text(
                                'পারলাম',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFFA3A3A3),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // ── Stats grid ──────────────────────────────────────────────
                Row(
                  children: [
                    _StatCard(
                      label: 'মোট',
                      value: _total,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _StatCard(
                      label: 'পারলাম',
                      value: _gotItCount,
                      color: const Color(0xFF047857),
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _StatCard(
                      label: 'কঠিন',
                      value: _strugglingCount,
                      color: const Color(0xFFDC2626),
                      isDark: isDark,
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // ── Struggling list ─────────────────────────────────────────
                if (_struggling.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF1C0A0A)
                          : const Color(0xFFFFF5F5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF3D1515)
                            : const Color(0xFFFECACA),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.warning_amber_rounded,
                              size: 16,
                              color: Color(0xFFDC2626),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'যেগুলো আরও পড়া দরকার (${_struggling.length})',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFDC2626),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ..._struggling
                            .take(3)
                            .toList()
                            .asMap()
                            .entries
                            .map(
                              (e) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text(
                                  '${e.key + 1}. ${e.value.questionText}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark
                                        ? const Color(0xFFFCA5A5)
                                        : const Color(0xFF991B1B),
                                  ),
                                ),
                              ),
                            ),
                        if (_struggling.length > 3)
                          Text(
                            'এবং আরও ${_struggling.length - 3}টি...',
                            style: const TextStyle(
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                              color: Color(0xFFA3A3A3),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Action buttons ──────────────────────────────────────────
                if (_struggling.isNotEmpty)
                  GestureDetector(
                    onTap: () => widget.onPracticeStruggling(_struggling),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDC2626),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(
                              0xFFDC2626,
                            ).withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.refresh_rounded,
                            size: 18,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'কঠিনগুলো আবার পড়ুন (${_struggling.length}টি)',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
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
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF262626) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF404040)
                            : const Color(0xFFE5E5E5),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        'অনুশীলনে ফিরে যান',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isDark
                              ? Colors.white
                              : const Color(0xFF171717),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),
              ],
            ),
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
    const strokeWidth = 10.0;

    // Background ring
    final bgPaint = Paint()
      ..color = isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, bgPaint);

    if (progress <= 0) return;

    // Foreground arc
    final fgPaint = Paint()
      ..shader = LinearGradient(
        colors: const [Color(0xFF15803D), Color(0xFF22C55E)],
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
  final bool isDark;

  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF171717) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
        ),
        child: Column(
          children: [
            Text(
              '$value',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFFA3A3A3),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
