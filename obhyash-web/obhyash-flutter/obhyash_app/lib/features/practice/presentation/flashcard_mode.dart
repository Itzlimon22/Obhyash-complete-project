import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../exam/presentation/widgets/question_report_dialog.dart';
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
  final List<FlashcardResult> _results = [];
  final AudioPlayer _audioPlayer = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _results.clear();
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  PracticeQuestion get current => widget.questions[_currentIndex];
  int get total => widget.questions.length;
  bool get isCorrect =>
      _selectedIdx != null && _selectedIdx == current.correctAnswerIndex;
  int get correctSoFar =>
      _results.where((r) => r.grade == FlashcardGrade.gotIt).length;

  void _handleSelect(int idx) async {
    if (_isRevealed) return;
    HapticFeedback.lightImpact();
    setState(() {
      _selectedIdx = idx;
      _isRevealed = true;
    });

    try {
      if (idx == current.correctAnswerIndex) {
        await _audioPlayer.play(AssetSource('audio/correct.wav'));
      } else {
        await _audioPlayer.play(AssetSource('audio/wrong.wav'));
      }
    } catch (e) {
      debugPrint('[FlashcardMode] Error playing sound: $e');
    }
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
    });
  }

  // ── Progress dots ───────────────────────────────────────────────────────────

  Widget _buildProgressDots(bool isDark) {
    return SizedBox(
      height: 20,
      child: Center(
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
              dotColor = const Color(0xFF059669);
            } else if (wrong) {
              dotColor = const Color(0xFFB91C1C);
            } else {
              dotColor = isDark
                  ? const Color(0xFF27272A)
                  : const Color(0xFFE5E5E5);
            }

            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 2.5),
              width: active ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: dotColor,
                borderRadius: BorderRadius.circular(100),
              ),
            );
          }),
        ),
      ),
    );
  }

  // ── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final q = current;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAFA),
      body: SafeArea(
        child: Column(
          children: [
            // ── Top status bar ────────────────────────────────────────────
            Container(
              color: isDark ? const Color(0xFF000000) : Colors.white,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            widget.onExit();
                          },
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
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
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark
                                      ? const Color(0xFFA3A3A3)
                                      : const Color(0xFF525252),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (total <= 12)
                          Flexible(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: _buildProgressDots(isDark),
                            ),
                          ),
                        Text(
                          '$correctSoFar/$total সঠিক',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
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
                        ? const Color(0xFF1C1C1E)
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
                  child: QuestionCard(
                    key: ValueKey('${q.id}_$_currentIndex'),
                    question: q.toQuestion(),
                    serialNumber: _currentIndex + 1,
                    selectedOptionIndex: _selectedIdx,
                    isFlagged: false,
                    onSelectOption: (idx) {
                      if (!_isRevealed) {
                        _handleSelect(idx);
                      }
                    },
                    onToggleFlag: () {},
                    onReport: () {
                      QuestionReportDialog.show(context, q.id);
                    },
                    showFeedback: _isRevealed,
                    readOnly: _isRevealed,
                    showAnswer: _isRevealed,
                    initiallyExpanded: true,
                  ),
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

  Widget _buildBottomNav(bool isDark) {
    final isLast = _currentIndex + 1 >= total;
    final nextLabel = isLast
        ? 'ফলাফল দেখো'
        : _isRevealed
        ? 'পরবর্তী প্রশ্ন'
        : 'পরবর্তী (স্কিপ)';

    Color nextBg;
    if (_isRevealed) {
      nextBg = isCorrect ? const Color(0xFF059669) : const Color(0xFFB91C1C);
    } else {
      nextBg = isDark ? const Color(0xFF1C1C1E) : const Color(0xFF000000);
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
            ? const Color(0xFF000000).withValues(alpha: 0.95)
            : Colors.white.withValues(alpha: 0.95),
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
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
                    : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE5E5E5),
                ),
              ),
              child: Icon(
                Icons.arrow_back_ios_new_rounded,
                size: 16,
                color: _currentIndex == 0
                    ? const Color(0xFFA3A3A3)
                    : (isDark ? Colors.white : const Color(0xFF000000)),
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
                    : const Color(0xFFB91C1C).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                isCorrect ? '✓ সঠিক' : '✗ ভুল',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: isCorrect
                      ? const Color(0xFF059669)
                      : const Color(0xFFB91C1C),
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
                      fontSize: 16,
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
