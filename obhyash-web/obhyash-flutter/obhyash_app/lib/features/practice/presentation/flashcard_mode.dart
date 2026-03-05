import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'practice_dashboard.dart';

// ─── Models ────────────────────────────────────────────────────────────────

enum FlashcardGrade { gotIt, struggling }

class FlashcardResult {
  final PracticeQuestion question;
  final FlashcardGrade grade;
  final int? selectedIndex;

  const FlashcardResult({
    required this.question,
    required this.grade,
    this.selectedIndex,
  });
}

// ─── Widget ─────────────────────────────────────────────────────────────────

class FlashcardMode extends StatefulWidget {
  final List<PracticeQuestion> questions;
  final void Function(List<FlashcardResult>) onComplete;
  final VoidCallback onExit;

  const FlashcardMode({
    super.key,
    required this.questions,
    required this.onComplete,
    required this.onExit,
  });

  @override
  State<FlashcardMode> createState() => _FlashcardModeState();
}

class _FlashcardModeState extends State<FlashcardMode> {
  int _currentIndex = 0;
  bool _isRevealed = false;
  int? _selectedIdx;
  bool _isExplanationOpen = false;
  final List<FlashcardResult> _results = [];

  static const _banglaIndices = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ'];

  PracticeQuestion get current => widget.questions[_currentIndex];
  int get total => widget.questions.length;
  bool get isCorrect =>
      _selectedIdx != null && _selectedIdx == current.correctAnswerIndex;
  int get correctSoFar =>
      _results.where((r) => r.grade == FlashcardGrade.gotIt).length;

  void _handleSelect(int idx) {
    if (_isRevealed) return;
    HapticFeedback.lightImpact();
    setState(() {
      _selectedIdx = idx;
      _isRevealed = true;
    });
  }

  void _handleNext() {
    final grade =
        (_selectedIdx != null && _selectedIdx == current.correctAnswerIndex)
        ? FlashcardGrade.gotIt
        : FlashcardGrade.struggling;

    final newResult = FlashcardResult(
      question: current,
      grade: grade,
      selectedIndex: _selectedIdx,
    );

    if (_currentIndex + 1 >= total) {
      widget.onComplete([..._results, newResult]);
      return;
    }

    setState(() {
      _results.add(newResult);
      _currentIndex++;
      _isRevealed = false;
      _selectedIdx = null;
      _isExplanationOpen = false;
    });
  }

  void _handlePrevious() {
    if (_currentIndex == 0 || _results.isEmpty) return;
    final prev = _results.last;
    setState(() {
      _results.removeLast();
      _currentIndex--;
      _selectedIdx = prev.selectedIndex;
      _isRevealed = prev.selectedIndex != null;
      _isExplanationOpen = false;
    });
  }

  // ── Option styling ──────────────────────────────────────────────────────────

  Color _optionBg(int idx, bool isDark) {
    if (_isRevealed) {
      if (idx == current.correctAnswerIndex) {
        return isDark ? const Color(0x3310B981) : const Color(0xFFECFDF5);
      }
      if (idx == _selectedIdx) {
        return isDark ? const Color(0x33EF4444) : const Color(0xFFFEF2F2);
      }
      return isDark
          ? const Color(0xFF262626).withValues(alpha: 0.6)
          : const Color(0xFFF5F5F5).withValues(alpha: 0.6);
    }
    return isDark ? const Color(0xFF262626) : const Color(0xFFFAFAFA);
  }

  Color _optionBorder(int idx, bool isDark) {
    if (_isRevealed) {
      if (idx == current.correctAnswerIndex) return const Color(0xFF059669);
      if (idx == _selectedIdx) return const Color(0xFFEF4444);
      return Colors.transparent;
    }
    return isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5);
  }

  // Returns (bg, borderColor, text) for the option bullet circle
  (Color, Color, String) _bulletStyle(int idx) {
    if (_isRevealed) {
      if (idx == current.correctAnswerIndex) {
        return (const Color(0xFF059669), const Color(0xFF059669), '✓');
      }
      if (idx == _selectedIdx) {
        return (const Color(0xFFEF4444), const Color(0xFFEF4444), '✕');
      }
    }
    return (
      Colors.transparent,
      const Color(0xFFA3A3A3),
      idx < _banglaIndices.length ? _banglaIndices[idx] : '${idx + 1}',
    );
  }

  // ── Progress dots ───────────────────────────────────────────────────────────

  Widget _buildProgressDots(bool isDark) {
    return SizedBox(
      height: 20,
      child: Center(
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(total, (i) {
              final done = i < _currentIndex;
              final active = i == _currentIndex;
              final correct =
                  done &&
                  i < _results.length &&
                  _results[i].grade == FlashcardGrade.gotIt;
              final wrong =
                  done &&
                  i < _results.length &&
                  _results[i].grade == FlashcardGrade.struggling;

              Color dotColor;
              if (active) {
                dotColor = const Color(0xFF059669);
              } else if (correct) {
                dotColor = const Color(0xFF10B981);
              } else if (wrong) {
                dotColor = const Color(0xFFEF4444);
              } else {
                dotColor = isDark
                    ? const Color(0xFF404040)
                    : const Color(0xFFE5E5E5);
              }

              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: active ? 20 : 10,
                height: 10,
                decoration: BoxDecoration(
                  color: dotColor,
                  borderRadius: BorderRadius.circular(5),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final q = current;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0A0A0A)
          : const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ──────────────────────────────────────────────────────
            Container(
              color: isDark ? const Color(0xFF0A0A0A) : Colors.white,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            widget.onExit();
                          },
                          child: Row(
                            children: [
                              Icon(
                                Icons.arrow_back,
                                size: 18,
                                color: isDark
                                    ? const Color(0xFFA3A3A3)
                                    : const Color(0xFF525252),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'বাতিল',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF525252),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        // Progress dots (max 14 shown)
                        if (total <= 20) _buildProgressDots(isDark),
                        const Spacer(),
                        // Correct count
                        Text(
                          '$correctSoFar/$total সঠিক',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? const Color(0xFF737373)
                                : const Color(0xFF737373),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Progress bar
                  LinearProgressIndicator(
                    value: _currentIndex / total,
                    backgroundColor: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFE5E5E5),
                    color: const Color(0xFF059669),
                    minHeight: 2,
                  ),
                ],
              ),
            ),

            // ── Scrollable card area ──────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  transitionBuilder: (child, animation) => FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.05, 0),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  ),
                  child: _buildCard(q, isDark),
                ),
              ),
            ),

            // ── Bottom navigation ─────────────────────────────────────────
            _buildBottomNav(isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(PracticeQuestion q, bool isDark) {
    final correctQuestionIndex = _currentIndex + 1;
    final leftBorderColor = !_isRevealed
        ? (isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5))
        : isCorrect
        ? const Color(0xFF059669)
        : const Color(0xFFEF4444);

    return Container(
      key: ValueKey(_currentIndex),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: BorderSide(color: leftBorderColor, width: 4),
          top: BorderSide(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
          right: BorderSide(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
          bottom: BorderSide(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x08000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Text(
                  'প্রশ্ন $correctQuestionIndex',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: Color(0xFFA3A3A3),
                  ),
                ),
                if (_isRevealed) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: isCorrect
                          ? const Color(0xFFECFDF5)
                          : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isCorrect ? 'সঠিক' : 'ভুল',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isCorrect
                            ? const Color(0xFF059669)
                            : const Color(0xFFEF4444),
                      ),
                    ),
                  ),
                ],
                if (q.subjectLabel.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      q.subjectLabel,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFA3A3A3),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Question text
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(
              q.questionText,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                height: 1.5,
                color: isDark ? Colors.white : const Color(0xFF171717),
              ),
            ),
          ),

          // Options
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Column(
              children: List.generate(q.options.length, (idx) {
                final optionBg = _optionBg(idx, isDark);
                final optionBorder = _optionBorder(idx, isDark);
                final (bulletBg, bulletBorder, bulletText) = _bulletStyle(idx);
                final isThisSelected = _selectedIdx == idx;
                final isCorrectOption = idx == q.correctAnswerIndex;
                final dimmed =
                    _isRevealed && !isThisSelected && !isCorrectOption;

                return GestureDetector(
                  onTap: () => _handleSelect(idx),
                  child: AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: dimmed ? 0.45 : 1.0,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: optionBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: optionBorder,
                          width: optionBorder == Colors.transparent ? 1 : 1.5,
                        ),
                      ),
                      child: Row(
                        children: [
                          // Bullet
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: bulletBg,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: bulletBorder,
                                width: 1.5,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                bulletText,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: bulletBg == Colors.transparent
                                      ? bulletBorder
                                      : Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Option text
                          Expanded(
                            child: Text(
                              q.options[idx],
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                height: 1.4,
                                color: isDark
                                    ? const Color(0xFFE5E5E5)
                                    : const Color(0xFF171717),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),

          // Explanation panel (collapsible) — only when revealed and explanation exists
          if (_isRevealed && q.explanation != null && q.explanation!.isNotEmpty)
            _buildExplanationPanel(q, isDark),
        ],
      ),
    );
  }

  Widget _buildExplanationPanel(PracticeQuestion q, bool isDark) {
    final correctLabel = q.correctAnswerIndex < _banglaIndices.length
        ? _banglaIndices[q.correctAnswerIndex]
        : '${q.correctAnswerIndex + 1}';

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      decoration: BoxDecoration(
        color: _isExplanationOpen
            ? (isDark
                  ? const Color(0xFF059669).withValues(alpha: 0.08)
                  : const Color(0xFFECFDF5))
            : (isDark ? const Color(0xFF1C1C1C) : const Color(0xFFFAFAFA)),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isExplanationOpen
              ? const Color(0xFF059669).withValues(alpha: 0.4)
              : (isDark ? const Color(0xFF333333) : const Color(0xFFE5E5E5)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Toggle row
          GestureDetector(
            onTap: () =>
                setState(() => _isExplanationOpen = !_isExplanationOpen),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Color(0xFF059669),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'সঠিক উত্তর : $correctLabel',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                    ),
                  ),
                  const Spacer(),
                  AnimatedRotation(
                    turns: _isExplanationOpen ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: Color(0xFF059669),
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Explanation text
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 200),
            crossFadeState: _isExplanationOpen
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: const SizedBox.shrink(),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: Text(
                q.explanation!,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.6,
                  color: isDark
                      ? const Color(0xFFD4D4D4)
                      : const Color(0xFF404040),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav(bool isDark) {
    final isLast = _currentIndex + 1 >= total;
    final nextLabel = isLast
        ? 'ফলাফল দেখো'
        : _isRevealed
        ? 'পরবর্তী প্রশ্ন'
        : 'পরবর্তী (স্কিপ)';

    Color nextBg;
    if (_isRevealed) {
      nextBg = isCorrect ? const Color(0xFF047857) : const Color(0xFFDC2626);
    } else {
      nextBg = isDark ? const Color(0xFF262626) : const Color(0xFF171717);
    }

    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF0A0A0A).withValues(alpha: 0.95)
            : Colors.white.withValues(alpha: 0.95),
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Previous button
          GestureDetector(
            onTap: _currentIndex == 0 ? null : _handlePrevious,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: _currentIndex == 0
                    ? (isDark
                          ? const Color(0xFF1C1C1C)
                          : const Color(0xFFF5F5F5))
                    : (isDark ? const Color(0xFF262626) : Colors.white),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF404040)
                      : const Color(0xFFE5E5E5),
                ),
              ),
              child: Icon(
                Icons.arrow_back_ios_new_rounded,
                size: 16,
                color: _currentIndex == 0
                    ? const Color(0xFFA3A3A3)
                    : (isDark ? Colors.white : const Color(0xFF171717)),
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Result chip
          if (_isRevealed)
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isCorrect
                    ? const Color(0xFF059669).withValues(alpha: 0.12)
                    : const Color(0xFFEF4444).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                isCorrect ? '✓ সঠিক' : '✗ ভুল',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isCorrect
                      ? const Color(0xFF059669)
                      : const Color(0xFFEF4444),
                ),
              ),
            ),
          if (!_isRevealed) const SizedBox(width: 8),

          const Spacer(),

          // Next / Skip button
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              _handleNext();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              decoration: BoxDecoration(
                color: nextBg,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: nextBg.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    nextLabel,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 13,
                    color: Colors.white,
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
