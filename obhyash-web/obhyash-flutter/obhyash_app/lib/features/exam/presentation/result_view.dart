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
import '../../../core/presentation/widgets/latex_text.dart';

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
// Exam Details Ribbon – Clean Subject Header with Chapters & Topics Modal Buttons
// ─────────────────────────────────────────────────────────────
class _ExamDetailsRibbon extends StatelessWidget {
  final ExamResult result;
  final bool isHistoryMode;
  final bool isDark;

  const _ExamDetailsRibbon({
    required this.result,
    required this.isHistoryMode,
    required this.isDark,
    bool showAllChapters = false,
    VoidCallback? onToggleChapters,
  });

  void _showChaptersBottomSheet(
      BuildContext context, List<String> chapters, String subjectName) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _MetadataListModal(
        title: 'পরীক্ষার অধ্যায়সমূহ',
        subtitle: subjectName,
        icon: Icons.layers_rounded,
        items: chapters,
        isDark: isDark,
        emptyMessage: 'এই পরীক্ষার জন্য নির্দিষ্ট কোনো অধ্যায় তালিকাভুক্ত নেই।',
      ),
    );
  }

  void _showTopicsBottomSheet(
      BuildContext context, List<String> topics, String subjectName) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _MetadataListModal(
        title: 'পরীক্ষার টপিকসমূহ',
        subtitle: subjectName,
        icon: Icons.tag_rounded,
        items: topics,
        isDark: isDark,
        emptyMessage: 'সিলেবাসের অন্তর্ভুক্ত সকল টপিক থেকে প্রশ্ন করা হয়েছে।',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chapters = result.questions
        .map((q) => q.chapter.trim())
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    final topics = result.questions
        .map((q) => (q.institutes.isNotEmpty ? '' : ''))
        .where((t) => t.isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    final subjectName = BanglaNameHelper.formatSubject(
        result.subject, result.subjectLabel);

    final accentColor =
        isDark ? const Color(0xFF34D399) : const Color(0xFF004633);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final bgColor =
        isDark ? const Color(0xFF141416) : Colors.white;
    final borderColor =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    final buttonBg =
        isDark ? const Color(0xFF202024) : const Color(0xFFF1F5F9);
    final buttonBorder =
        isDark ? const Color(0xFF2E2E33) : const Color(0xFFE2E8F0);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.28 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // ── Left: Subject Icon & Subject Name ──
          Expanded(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: isDark ? 0.15 : 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: accentColor.withValues(alpha: 0.25),
                      width: 0.8,
                    ),
                  ),
                  child: Icon(
                    Icons.menu_book_rounded,
                    size: 16,
                    color: accentColor,
                  ),
                ),
                const SizedBox(width: 9),
                Flexible(
                  child: Text(
                    subjectName,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'HindSiliguri',
                      color: textColor,
                      height: 1.2,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // ── Right: Action Buttons (Chapters & Topics) ──
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Chapters Button
              _ActionPillButton(
                icon: Icons.layers_rounded,
                label: chapters.isNotEmpty
                    ? 'অধ্যায় (${chapters.length})'
                    : 'অধ্যায়সমূহ',
                bgColor: buttonBg,
                borderColor: buttonBorder,
                textColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF334155),
                iconColor: accentColor,
                onTap: () =>
                    _showChaptersBottomSheet(context, chapters, subjectName),
              ),

              const SizedBox(width: 6),

              // Topics Button
              _ActionPillButton(
                icon: Icons.tag_rounded,
                label: 'টপিকসমূহ',
                bgColor: buttonBg,
                borderColor: buttonBorder,
                textColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF334155),
                iconColor: isDark ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                onTap: () =>
                    _showTopicsBottomSheet(context, topics, subjectName),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Pill Button for Ribbon Actions
// ─────────────────────────────────────────────────────────────
class _ActionPillButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color bgColor;
  final Color borderColor;
  final Color textColor;
  final Color iconColor;
  final VoidCallback onTap;

  const _ActionPillButton({
    required this.icon,
    required this.label,
    required this.bgColor,
    required this.borderColor,
    required this.textColor,
    required this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6.5),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: borderColor, width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 13.5, color: iconColor),
              const SizedBox(width: 4.5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'HindSiliguri',
                  color: textColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Sleek Modal BottomSheet for Chapters & Topics Display
// ─────────────────────────────────────────────────────────────
class _MetadataListModal extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final List<String> items;
  final bool isDark;
  final String emptyMessage;

  const _MetadataListModal({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.items,
    required this.isDark,
    required this.emptyMessage,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = isDark ? const Color(0xFF141416) : Colors.white;
    final cardBg = isDark ? const Color(0xFF1E1E22) : const Color(0xFFF8FAFC);
    final cardBorder = isDark ? const Color(0xFF2E2E33) : const Color(0xFFE2E8F0);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final subColor = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);
    final accentColor = isDark ? const Color(0xFF34D399) : const Color(0xFF004633);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: accentColor.withValues(alpha: 0.3),
                  ),
                ),
                child: Icon(icon, size: 20, color: accentColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'HindSiliguri',
                        color: textColor,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'HindSiliguri',
                        color: subColor,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: Icon(
                  Icons.close_rounded,
                  color: subColor,
                  size: 22,
                ),
                splashRadius: 20,
              ),
            ],
          ),

          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 14),

          // Items List
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 8),
              child: Column(
                children: [
                  Icon(
                    Icons.check_circle_outline_rounded,
                    size: 36,
                    color: accentColor.withValues(alpha: 0.7),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    emptyMessage,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'HindSiliguri',
                      color: subColor,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            )
          else
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: items.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, idx) {
                  final item = items[idx];
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 11,
                    ),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: cardBorder),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: accentColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(7),
                          ),
                          child: Text(
                            '${idx + 1}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: accentColor,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: LatexText(
                            text: item,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'HindSiliguri',
                              color: textColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
