import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../domain/exam_models.dart';
import 'widgets/result_stats.dart';
import 'widgets/question_card.dart';
import 'widgets/question_report_dialog.dart';
import '../services/pdf_download_service.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/presentation/widgets/obhyash_tooltip.dart';

class ResultView extends StatefulWidget {
  final ExamResult result;
  final VoidCallback onRestart;
  final bool isHistoryMode;

  const ResultView({
    super.key,
    required this.result,
    required this.onRestart,
    this.isHistoryMode = false,
  });

  @override
  State<ResultView> createState() => _ResultViewState();
}

class _ResultViewState extends State<ResultView> {
  final Set<String> _bookmarkedIds = {};
  late final ConfettiController _confettiController;
  String _reviewFilter = 'all'; // 'all', 'correct', 'wrong', 'skipped'
  bool _showAllChapters = false;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 3),
    );

    _confettiController.play();
    _fetchBookmarks();
  }

  Future<void> _fetchBookmarks() async {
    final supabase = Supabase.instance.client;
    final uid = supabase.auth.currentUser?.id;
    if (uid != null && widget.result.questions.isNotEmpty) {
      try {
        final bRes = await supabase
            .from('bookmarks')
            .select('question_id')
            .eq('user_id', uid)
            .inFilter('question_id', widget.result.questions.map((q) => q.id).toList());
        
        if (mounted) {
          setState(() {
            _bookmarkedIds.addAll((bRes as List).map((row) => row['question_id'].toString()));
          });
        }
      } catch (e) {
        debugPrint('[ResultView] Bookmark fetch error: $e');
      }
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  void _toggleBookmark(String id) {
    final wasBookmarked = _bookmarkedIds.contains(id);
    setState(() {
      if (wasBookmarked) {
        _bookmarkedIds.remove(id);
      } else {
        _bookmarkedIds.add(id);
      }
    });
    // Persist to Supabase bookmarks table
    final supabase = Supabase.instance.client;
    final uid = supabase.auth.currentUser?.id;
    if (uid != null) {
      if (wasBookmarked) {
        supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', uid)
            .eq('question_id', id)
            .then((_) {})
            .catchError((_) {});
      } else {
        supabase
            .from('bookmarks')
            .insert({'user_id': uid, 'question_id': id})
            .then((_) {})
            .catchError((_) {});
      }
    }
  }

  void _showReportModal(String questionId) {
    QuestionReportDialog.show(context, questionId);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Derived values
    final skippedCount =
        widget.result.totalQuestions -
        (widget.result.correctCount + widget.result.wrongCount);
    final negativeMarksDeduction =
        widget.result.wrongCount * widget.result.negativeMarking;
    final percentage = widget.result.totalMarks > 0
        ? (widget.result.score / widget.result.totalMarks) * 100
        : 0.0;

    // Filter counts
    int correctCount = 0;
    int wrongCount = 0;
    int skipCount = 0;

    for (var q in widget.result.questions) {
      final ua = widget.result.userAnswers[q.id];
      if (ua == null) {
        skipCount++;
      } else if (ua == q.correctAnswerIndex) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    final filteredQuestions = widget.result.questions.where((q) {
      final ua = widget.result.userAnswers[q.id];
      final isSkipped = ua == null;
      final isCorrect = !isSkipped && (ua == q.correctAnswerIndex);
      final isWrong = !isSkipped && !isCorrect;

      if (_reviewFilter == 'correct' && !isCorrect) return false;
      if (_reviewFilter == 'wrong' && !isWrong) return false;
      if (_reviewFilter == 'skipped' && !isSkipped) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: const Text(
          'পরীক্ষার ফলাফল',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(widget.isHistoryMode ? Icons.arrow_back : Icons.close),
          onPressed: () {
            if (widget.isHistoryMode) {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              } else {
                context.go('/history');
              }
            } else {
              Navigator.of(context, rootNavigator: true)
                  .popUntil((route) => route.isFirst);
              context.go('/dashboard');
            }
          },
        ),
      ),
      body: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // ── Top Summary & Stats Section ──
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
              child: Column(
                children: [


                  // Top Action buttons (PDF)
                  Row(
                    children: [
                      Expanded(
                        child: ObhyashTooltip(
                          message: 'শুধুমাত্র প্রশ্নপত্রের PDF ডাউনলোড করো',
                          preferredPosition: TooltipPosition.top,
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              AppPopups.show(
                                context,
                                message: 'PDF তৈরি হচ্ছে, একটু অপেক্ষা করুন...',
                                isError: false,
                              );
                              await PdfDownloadService.downloadQuestionPaper(
                                  widget.result, context);
                            },
                            icon: const Icon(Icons.download_rounded, size: 16),
                            label: const Text(
                              'প্রশ্নপত্র',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
                              foregroundColor: isDark ? const Color(0xFF34D399) : const Color(0xFF004633),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              side: BorderSide(
                                color: isDark ? const Color(0xFF27272A) : const Color(0xFF004633),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ObhyashTooltip(
                          message: 'প্রতিটি প্রশ্নের সঠিক উত্তর ও বিস্তারিত ব্যাখ্যা সহ PDF ডাউনলোড করো',
                          preferredPosition: TooltipPosition.top,
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              AppPopups.show(
                                context,
                                message: 'PDF তৈরি হচ্ছে, একটু অপেক্ষা করুন...',
                                isError: false,
                              );
                              await PdfDownloadService.downloadResultWithExplanations(
                                  widget.result, context);
                            },
                            icon: const Icon(Icons.download_done_rounded, size: 16),
                            label: const Text(
                              'ফলাফল ও ব্যাখ্যা',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: isDark
                                  ? const Color(0xFF059669).withValues(alpha: 0.18)
                                  : const Color(0xFF004633).withValues(alpha: 0.1),
                              foregroundColor: isDark ? const Color(0xFF34D399) : const Color(0xFF004633),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              side: BorderSide(
                                color: isDark
                                    ? const Color(0xFF059669).withValues(alpha: 0.4)
                                    : const Color(0xFF004633),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Exam Details Ribbon
                  _ExamDetailsRibbon(
                    result: widget.result,
                    isHistoryMode: widget.isHistoryMode,
                    isDark: isDark,
                    showAllChapters: _showAllChapters,
                    onToggleChapters: () =>
                        setState(() => _showAllChapters = !_showAllChapters),
                  ),

                  ResultStats(
                    percentage: percentage,
                    finalScore: widget.result.score.toDouble(),
                    totalPoints: widget.result.totalMarks.toInt(),
                    timeTaken: widget.result.timeTaken,
                    totalQuestions: widget.result.totalQuestions,
                    correctCount: widget.result.correctCount,
                    wrongCount: widget.result.wrongCount,
                    skippedCount: skippedCount,
                    negativeMarking: widget.result.negativeMarking,
                    negativeMarksDeduction: negativeMarksDeduction,
                  ),
                ],
              ),
            ),
          ),

          // ── Section Title ──
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 28, 16, 8),
              child: Text(
                'উত্তরপত্র পর্যালোচনা',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF111827),
                ),
              ),
            ),
          ),

          // ── Sticky Filter Header (Pinned on Scroll) ──
          SliverPersistentHeader(
            pinned: true,
            delegate: _StickyFilterDelegate(
              isDark: isDark,
              child: Container(
                color: isDark ? Colors.black : const Color(0xFFFAFAFA),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                alignment: Alignment.centerLeft,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      _ResultFilterChip(
                        label: 'সব (${widget.result.questions.length})',
                        isSelected: _reviewFilter == 'all',
                        onTap: () => setState(() => _reviewFilter = 'all'),
                        isDark: isDark,
                      ),
                      const SizedBox(width: 8),
                      _ResultFilterChip(
                        label: 'সঠিক ($correctCount)',
                        dotColor: const Color(0xFF10B981),
                        isSelected: _reviewFilter == 'correct',
                        onTap: () => setState(() => _reviewFilter = 'correct'),
                        isDark: isDark,
                      ),
                      const SizedBox(width: 8),
                      _ResultFilterChip(
                        label: 'ভুল ($wrongCount)',
                        dotColor: const Color(0xFFEF4444),
                        isSelected: _reviewFilter == 'wrong',
                        onTap: () => setState(() => _reviewFilter = 'wrong'),
                        isDark: isDark,
                      ),
                      const SizedBox(width: 8),
                      _ResultFilterChip(
                        label: 'স্কিপ ($skipCount)',
                        dotColor: const Color(0xFF9CA3AF),
                        isSelected: _reviewFilter == 'skipped',
                        onTap: () => setState(() => _reviewFilter = 'skipped'),
                        isDark: isDark,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 6),
          ),

          // ── Virtualized Question Cards ──
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList.builder(
              itemCount: filteredQuestions.length,
              itemBuilder: (context, index) {
                final q = filteredQuestions[index];
                final originalIndex = widget.result.questions.indexOf(q);
                return RepaintBoundary(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: QuestionCard(
                      key: ValueKey(q.id),
                      question: q,
                      serialNumber: originalIndex + 1,
                      selectedOptionIndex: widget.result.userAnswers[q.id],
                      isFlagged: false,
                      isBookmarked: _bookmarkedIds.contains(q.id),
                      onToggleBookmark: () => _toggleBookmark(q.id),
                      onReport: () => _showReportModal(q.id),
                      onSelectOption: (_) {},
                      onToggleFlag: () {},
                      showFeedback: true,
                      readOnly: true,
                      initiallyExpanded: false,
                    ),
                  ),
                );
              },
            ),
          ),

          // ── Bottom Action (Redirect to Exam Setup) ──
          if (!widget.isHistoryMode)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      if (context.mounted) {
                        Navigator.of(context, rootNavigator: true)
                            .popUntil((route) => route.isFirst);
                        context.go('/setup');
                      }
                    },
                    icon: const Icon(
                      LucideIcons.rotateCcw,
                      size: 18,
                      color: Colors.white,
                    ),
                    label: const Text(
                      'আবার পরীক্ষা দাও',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        fontFamily: 'HindSiliguri',
                        color: Colors.white,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF004633),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ),
            ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 20),
          ),
        ],
      ),
      floatingActionButton: Align(
        alignment: Alignment.topCenter,
        child: ConfettiWidget(
          confettiController: _confettiController,
          blastDirectionality: BlastDirectionality.explosive,
          shouldLoop: false,
          colors: const [
            Colors.green,
            Colors.blue,
            Colors.pink,
            Colors.orange,
            Colors.purple,
          ],
          createParticlePath: drawStar,
        ),
      ),
    );
  }

  Path drawStar(Size size) {
    // Method to convert degree to radians
    double degToRad(double deg) => deg * (3.1415926535897932 / 180.0);

    const numberOfPoints = 5;
    final halfWidth = size.width / 2;
    final externalRadius = halfWidth;
    final internalRadius = halfWidth / 2.5;
    final degreesPerStep = degToRad(360 / numberOfPoints);
    final halfDegreesPerStep = degreesPerStep / 2;
    final path = Path();
    final fullAngle = degToRad(360);
    path.moveTo(size.width, halfWidth);

    for (double step = 0; step < fullAngle; step += degreesPerStep) {
      path.lineTo(
        halfWidth +
            externalRadius *
                1.5 *
                1.0, 
        halfWidth + externalRadius * 1.5 * 1.0,
      );
      final dummyVar = halfDegreesPerStep;
      path.lineTo(
        halfWidth + internalRadius * 1.0 + dummyVar * 0.0,
        halfWidth + internalRadius * 1.0,
      );
    }
    path.close();
    return path;
  }
}

// ── Filter Button Chip (Borderless & Bold when Selected) ──────────────────────

class _ResultFilterChip extends StatelessWidget {
  final String label;
  final Color? dotColor;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isDark;

  const _ResultFilterChip({
    required this.label,
    this.dotColor,
    required this.isSelected,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final bg = isSelected
        ? (isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB))
        : (isDark ? const Color(0xFF18181B) : const Color(0xFFF4F4F5));

    final textColor = isSelected
        ? (isDark ? Colors.white : const Color(0xFF111827))
        : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280));

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          // No border as requested
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (dotColor != null) ...[
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.normal,
                fontFamily: 'HindSiliguri',
                color: textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sticky Filter Header Delegate ─────────────────────────────────────────────

class _StickyFilterDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final bool isDark;

  _StickyFilterDelegate({required this.child, required this.isDark});

  @override
  double get minExtent => 52.0;

  @override
  double get maxExtent => 52.0;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.black : const Color(0xFFFAFAFA),
        border: shrinkOffset > 0
            ? Border(
                bottom: BorderSide(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFE5E7EB),
                  width: 1,
                ),
              )
            : null,
      ),
      child: child,
    );
  }

  @override
  bool shouldRebuild(covariant _StickyFilterDelegate oldDelegate) {
    return true;
  }
}

// ─────────────────────────────────────────────────────────────
// Exam Details Ribbon  –  smart collapsible chapter chip row
// ─────────────────────────────────────────────────────────────
class _ExamDetailsRibbon extends StatelessWidget {
  final ExamResult result;
  final bool isHistoryMode;
  final bool isDark;
  final bool showAllChapters;
  final VoidCallback onToggleChapters;

  const _ExamDetailsRibbon({
    required this.result,
    required this.isHistoryMode,
    required this.isDark,
    required this.showAllChapters,
    required this.onToggleChapters,
  });

  static const int _kMaxVisible = 3;

  @override
  Widget build(BuildContext context) {
    // Derive unique non-empty chapters from questions
    final chapters = result.questions
        .map((q) => q.chapter.trim())
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    final accentColor =
        isDark ? const Color(0xFF34D399) : const Color(0xFF004633);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final subTextColor =
        isDark ? const Color(0xFF71717A) : const Color(0xFF64748B);
    final bgColor =
        isDark ? const Color(0xFF18181B) : const Color(0xFFF8FAFC);
    final borderColor =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    final chipBg =
        isDark ? const Color(0xFF27272A) : const Color(0xFFEFF6FF);
    final chipBorder =
        isDark ? const Color(0xFF3F3F46) : const Color(0xFFBFDBFE);

    final visibleChapters =
        (!showAllChapters && chapters.length > _kMaxVisible)
            ? chapters.sublist(0, _kMaxVisible)
            : chapters;
    final hiddenCount = chapters.length - _kMaxVisible;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.28 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Top meta row: subject | mode | question count ──
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _MetaChip(
                icon: Icons.menu_book_rounded,
                label: BanglaNameHelper.formatSubject(
                    result.subject, result.subjectLabel),
                accentColor: accentColor,
                textColor: textColor,
              ),
              _MetaChip(
                icon: Icons.history_rounded,
                label: isHistoryMode ? 'ইতিহাস' : 'আজকের পরীক্ষা',
                accentColor: accentColor,
                textColor: textColor,
              ),
              _MetaChip(
                icon: Icons.help_outline_rounded,
                label: 'মোট প্রশ্ন: ${result.totalQuestions}',
                accentColor: accentColor,
                textColor: textColor,
              ),
            ],
          ),

          // ── Chapter chips section ──
          if (chapters.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.only(top: 10, bottom: 6),
              child: Row(
                children: [
                  Icon(Icons.layers_rounded, size: 13, color: subTextColor),
                  const SizedBox(width: 4),
                  Text(
                    'অধ্যায়সমূহ',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: subTextColor,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 260),
              curve: Curves.easeInOut,
              alignment: Alignment.topLeft,
              child: Wrap(
                spacing: 7,
                runSpacing: 7,
                children: [
                  ...visibleChapters.map(
                    (ch) => _ChapterChip(
                      label: ch,
                      chipBg: chipBg,
                      chipBorder: chipBorder,
                      textColor: textColor,
                    ),
                  ),

                  // "Show more" toggle chip
                  if (!showAllChapters && hiddenCount > 0)
                    _ToggleChip(
                      label: '+$hiddenCount আরো',
                      onTap: onToggleChapters,
                      accentColor: accentColor,
                      isDark: isDark,
                    ),
                  if (showAllChapters && chapters.length > _kMaxVisible)
                    _ToggleChip(
                      label: 'কম দেখো ↑',
                      onTap: onToggleChapters,
                      accentColor: accentColor,
                      isDark: isDark,
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color accentColor;
  final Color textColor;

  const _MetaChip({
    required this.icon,
    required this.label,
    required this.accentColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: accentColor),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            fontFamily: 'HindSiliguri',
            color: textColor,
          ),
        ),
      ],
    );
  }
}

class _ChapterChip extends StatelessWidget {
  final String label;
  final Color chipBg;
  final Color chipBorder;
  final Color textColor;

  const _ChapterChip({
    required this.label,
    required this.chipBg,
    required this.chipBorder,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: chipBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: chipBorder, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          fontFamily: 'HindSiliguri',
          color: textColor,
        ),
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final Color accentColor;
  final bool isDark;

  const _ToggleChip({
    required this.label,
    required this.onTap,
    required this.accentColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: accentColor.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: accentColor.withValues(alpha: 0.35)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            fontFamily: 'HindSiliguri',
            color: accentColor,
          ),
        ),
      ),
    );
  }
}
