import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/haptics_service.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../domain/exam_models.dart';
import 'widgets/result_stats.dart';
import 'widgets/question_card.dart';
import 'widgets/question_report_dialog.dart';
import 'widgets/exam_scope_header.dart';
import '../services/pdf_download_service.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/presentation/widgets/obhyash_tooltip.dart';
import '../../../core/presentation/widgets/pro_upgrade_modal.dart';
import '../../gamification/services/gamification_service.dart';

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

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 3),
    );

    // Only celebrate with confetti once right after direct exam completion
    if (!widget.isHistoryMode) {
      _confettiController.play();
      AppHaptics.celebrate();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final uid = Supabase.instance.client.auth.currentUser?.id;
        if (uid != null && mounted) {
          GamificationService.checkAndUnlockBadges(
            context: context,
            userId: uid,
            latestScore: widget.result.correctCount,
            totalQuestions: widget.result.totalQuestions,
            timeTakenSeconds: widget.result.timeTaken,
          );
        }
      });
    }
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

    if (!wasBookmarked && _bookmarkedIds.length >= 25) {
      final supabase = Supabase.instance.client;
      final uid = supabase.auth.currentUser?.id;
      if (uid != null) {
        supabase.from('users').select('is_subscribed, subscription_status, subscription_expires_at').eq('id', uid).maybeSingle().then((userRow) {
          final expStr = userRow?['subscription_expires_at']?.toString();
          final exp = expStr != null ? DateTime.tryParse(expStr) : null;
          final isNotExpired = exp != null && exp.isAfter(DateTime.now());
          final isSub = isNotExpired && ((userRow?['is_subscribed'] == true) || (userRow?['subscription_status']?.toString().toLowerCase() == 'active'));
          if (!isSub) {
            if (mounted) {
              ProUpgradeModal.show(
                context,
                title: 'বুকমার্ক লিমিট শেষ 📌',
                message: 'ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন বুকমার্ক করা যাবে। আনলিমিটেড বুকমার্ক ও স্টাডি নোটের জন্য প্রো সাবস্ক্রিপশন নাও।',
                featurePill: 'বুকমার্ক লিমিট: ২৫/২৫',
                icon: LucideIcons.bookmark,
              );
            }
            return;
          }
          _executeToggleBookmark(id, wasBookmarked, uid);
        }).catchError((_) {
          _executeToggleBookmark(id, wasBookmarked, uid);
        });
        return;
      }
    }

    final uid = Supabase.instance.client.auth.currentUser?.id;
    _executeToggleBookmark(id, wasBookmarked, uid);
  }

  void _executeToggleBookmark(String id, bool wasBookmarked, String? uid) {
    setState(() {
      if (wasBookmarked) {
        _bookmarkedIds.remove(id);
      } else {
        _bookmarkedIds.add(id);
      }
    });
    // Persist to Supabase bookmarks table
    final supabase = Supabase.instance.client;
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

    final distinctMainSubjects = widget.result.questions
        .map((q) => BanglaNameHelper.getMainSubjectName(q.subject, q.subjectLabel))
        .toSet()
        .toList();

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
          style: TextStyle(
            fontSize: 15.5,
            fontWeight: FontWeight.w600,
            fontFamily: 'HindSiliguri',
          ),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: Icon(widget.isHistoryMode ? Icons.arrow_back : Icons.close, size: 20),
          onPressed: () {
            if (widget.isHistoryMode) {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              } else {
                context.go('/history');
              }
            } else {
              if (Navigator.of(context, rootNavigator: true).canPop()) {
                Navigator.of(context, rootNavigator: true)
                    .popUntil((route) => route.isFirst);
              }
              context.go('/');
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
              padding: const EdgeInsets.fromLTRB(10, 16, 10, 0),
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
                              AppPopups.info(
                                context,
                                message: 'PDF তৈরি হচ্ছে, একটু অপেক্ষা করো...',
                              );
                              await PdfDownloadService.downloadQuestionPaper(
                                  widget.result, context);
                            },
                            icon: const Icon(Icons.download_rounded, size: 15),
                            label: const Text(
                              'প্রশ্নপত্র',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: isDark ? const Color(0xFF2C2C2C) : Colors.white,
                              foregroundColor: isDark ? Colors.white : const Color(0xFF12544F),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              side: BorderSide(
                                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFF12544F),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
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
                              AppPopups.info(
                                context,
                                message: 'PDF তৈরি হচ্ছে, একটু অপেক্ষা করো...',
                              );
                              await PdfDownloadService.downloadResultWithExplanations(
                                  widget.result, context);
                            },
                            icon: const Icon(Icons.download_done_rounded, size: 15),
                            label: const Text(
                              'ফলাফল ও ব্যাখ্যা',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: isDark
                                  ? const Color(0xFF12544F).withValues(alpha: 0.22)
                                  : const Color(0xFF12544F).withValues(alpha: 0.1),
                              foregroundColor: isDark ? const Color(0xFF34D399) : const Color(0xFF12544F),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              side: BorderSide(
                                color: isDark
                                    ? const Color(0xFF12544F).withValues(alpha: 0.4)
                                    : const Color(0xFF12544F),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Exam Details Scope Header / 2-Column Preset Info Card
                  if (distinctMainSubjects.length > 1 ||
                      (widget.result.subjectLabel != null &&
                          ['BUET', 'CKRUET', 'Medical', 'DU Ka', 'JU D', 'GST', 'Agri'].any((p) =>
                              widget.result.subjectLabel!.toUpperCase().contains(p.toUpperCase()))))
                    Container(
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF18181B) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        children: [
                          // Column 1: Exam Name
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'পরীক্ষা',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  widget.result.subjectLabel?.isNotEmpty == true
                                      ? widget.result.subjectLabel!
                                      : BanglaNameHelper.formatSubject(widget.result.subject),
                                  style: TextStyle(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w600,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            height: 36,
                            width: 1,
                            color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                          ),
                          const SizedBox(width: 14),
                          // Column 2: Subjects Name
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'বিষয়সমূহ (${BanglaNameHelper.toBanglaNumeral(distinctMainSubjects.length)}টি)',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  distinctMainSubjects.join(' • '),
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    fontFamily: 'HindSiliguri',
                                    color: isDark ? const Color(0xFF34D399) : const Color(0xFF047857),
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ExamScopeHeader(
                      subjectName: BanglaNameHelper.formatSubject(
                        widget.result.subject,
                        widget.result.subjectLabel,
                      ),
                      chapters: widget.result.questions
                          .map((q) => q.chapter.trim())
                          .where((c) => c.isNotEmpty)
                          .toSet()
                          .toList()
                        ..sort(),
                      topics: widget.result.questions
                          .map((q) => (q.institutes.isNotEmpty ? '' : ''))
                          .where((t) => t.isNotEmpty)
                          .toSet()
                          .toList()
                        ..sort(),
                      isDark: isDark,
                      margin: const EdgeInsets.symmetric(vertical: 12),
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
                    questions: widget.result.questions,
                    userAnswers: widget.result.userAnswers,
                  ),
                ],
              ),
            ),
          ),

          // ── Section Title ──
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 24, 10, 8),
              child: Text(
                'উত্তরপত্র পর্যালোচনা',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
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
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
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
            padding: const EdgeInsets.symmetric(horizontal: 10),
            sliver: SliverList.builder(
              itemCount: filteredQuestions.length,
              itemBuilder: (context, index) {
                final q = filteredQuestions[index];
                final originalIndex = widget.result.questions.indexOf(q);

                final hasMultipleSubjects = distinctMainSubjects.length > 1;
                final currentSubjectName =
                    BanglaNameHelper.getMainSubjectName(q.subject, q.subject);

                final isFirstOfSubject = index == 0 ||
                    BanglaNameHelper.getMainSubjectName(
                          filteredQuestions[index - 1].subject,
                          filteredQuestions[index - 1].subject,
                        ) !=
                        currentSubjectName;

                int subjectTotalInFilter = 0;
                if (isFirstOfSubject) {
                  subjectTotalInFilter = filteredQuestions
                      .where((item) =>
                          BanglaNameHelper.getMainSubjectName(
                            item.subject,
                            item.subject,
                          ) ==
                          currentSubjectName)
                      .length;
                }

                return RepaintBoundary(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (hasMultipleSubjects && isFirstOfSubject)
                          Container(
                            margin: EdgeInsets.only(
                              top: index == 0 ? 4 : 20,
                              bottom: 12,
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Divider(
                                    color: isDark
                                        ? const Color(0xFF27272A)
                                        : const Color(0xFFE2E8F0),
                                    thickness: 1,
                                  ),
                                ),
                                Padding(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 14),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        currentSubjectName,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          fontFamily: 'HindSiliguri',
                                          color: isDark
                                              ? const Color(0xFFE4E4E7)
                                              : const Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        '(${BanglaNameHelper.toBanglaNumeral(subjectTotalInFilter)}টি প্রশ্ন)',
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w500,
                                          fontFamily: 'HindSiliguri',
                                          color: isDark
                                              ? const Color(0xFF34D399)
                                              : const Color(0xFF047857),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: Divider(
                                    color: isDark
                                        ? const Color(0xFF27272A)
                                        : const Color(0xFFE2E8F0),
                                    thickness: 1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        QuestionCard(
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
                      ],
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
                padding: const EdgeInsets.fromLTRB(10, 12, 10, 24),
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
                        fontSize: 16,
                        fontFamily: 'HindSiliguri',
                        color: Colors.white,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF12544F),
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
      floatingActionButton: widget.isHistoryMode
          ? null
          : Align(
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
                fontSize: 13,
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
