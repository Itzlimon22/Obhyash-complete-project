import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../../core/presentation/widgets/obhyash_tooltip.dart';
import '../../../core/providers/theme_provider.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../exam/presentation/widgets/question_report_dialog.dart';
import '../domain/models.dart';
import '../providers/live_exam_providers.dart';

class LiveExamSessionView extends ConsumerStatefulWidget {
  final String examId;
  final LiveExam? exam;

  const LiveExamSessionView({
    super.key,
    required this.examId,
    this.exam,
  });

  @override
  ConsumerState<LiveExamSessionView> createState() => _LiveExamSessionViewState();
}

class _LiveExamSessionViewState extends ConsumerState<LiveExamSessionView> {
  final Map<String, int> _userAnswers = {};
  final Set<String> _flaggedIds = {};
  final Set<String> _bookmarkedIds = {};
  final ScrollController _scrollController = ScrollController();
  final Map<int, GlobalKey> _itemKeys = {};

  Timer? _timer;
  int _secondsRemaining = 0;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final durationMins = widget.exam?.durationMinutes ?? 45;
    _secondsRemaining = durationMins * 60;
    _startTimer();
    _fetchBookmarks();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        _timer?.cancel();
        _autoSubmit();
      }
    });
  }

  Future<void> _fetchBookmarks() async {
    final supabase = Supabase.instance.client;
    final user = supabase.auth.currentUser;
    if (user == null) return;

    try {
      final res = await supabase
          .from('bookmarks')
          .select('question_id')
          .eq('user_id', user.id);
      if (mounted) {
        setState(() {
          _bookmarkedIds.addAll(res.map((r) => r['question_id'].toString()));
        });
      }
    } catch (_) {}
  }

  Future<void> _toggleBookmark(String questionId) async {
    final supabase = Supabase.instance.client;
    final user = supabase.auth.currentUser;
    if (user == null) {
      AppPopups.show(context, message: 'বুকমার্ক করতে লগইন করুন', isError: true);
      return;
    }

    final isBookmarked = _bookmarkedIds.contains(questionId);
    setState(() {
      if (isBookmarked) {
        _bookmarkedIds.remove(questionId);
      } else {
        _bookmarkedIds.add(questionId);
      }
    });

    try {
      if (isBookmarked) {
        await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('question_id', questionId);
      } else {
        await supabase.from('bookmarks').insert({
          'user_id': user.id,
          'question_id': questionId,
          'created_at': DateTime.now().toIso8601String(),
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  String _formatTime(int totalSeconds) {
    if (totalSeconds <= 0) return '00:00';
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _autoSubmit() async {
    if (_isSubmitting) return;
    AppPopups.show(
      context,
      message: 'সময় শেষ! উত্তরপত্র জমা দেওয়া হচ্ছে...',
      isError: false,
    );
    await _submitExam();
  }

  Future<void> _submitExam() async {
    if (_isSubmitting) return;
    setState(() {
      _isSubmitting = true;
    });

    final questions = ref.read(liveExamQuestionsProvider(widget.examId)).value ?? [];
    final negativeRate = widget.exam?.negativeMarking.toDouble() ?? 0.25;

    num rawScore = 0;
    int correctCount = 0;
    int wrongCount = 0;

    for (final q in questions) {
      final userPick = _userAnswers[q.id];
      if (userPick != null) {
        if (userPick == q.correctAnswerIndex) {
          rawScore += q.points;
          correctCount++;
        } else {
          wrongCount++;
          rawScore -= (q.points * negativeRate);
        }
      }
    }

    final finalScore = rawScore < 0 ? 0 : rawScore;

    try {
      if (!widget.examId.startsWith('mock-')) {
        final supabase = Supabase.instance.client;
        final user = supabase.auth.currentUser;

        if (user != null) {
          await supabase.from('live_exam_attempts').upsert({
            'live_exam_id': widget.examId,
            'user_id': user.id,
            'status': 'submitted',
            'score': finalScore,
            'correct_count': correctCount,
            'wrong_count': wrongCount,
            'user_answers': _userAnswers,
            'submit_time': DateTime.now().toIso8601String(),
          });
        }
      }

      // Invalidate details so it reloads attempt status
      ref.invalidate(liveExamDetailsProvider(widget.examId));
      ref.invalidate(liveExamsProvider);

      if (mounted) {
        context.pop();
        AppPopups.show(
          context,
          message: 'উত্তরপত্র সফলভাবে জমা দেওয়া হয়েছে!',
          isError: false,
        );
      }
    } catch (e) {
      if (mounted) {
        AppPopups.show(
          context,
          message: 'জমা দিতে ত্রুটি হয়েছে: $e',
          isError: true,
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _scrollToQuestion(int index) {
    final key = _itemKeys[index];
    if (key?.currentContext != null) {
      Scrollable.ensureVisible(
        key!.currentContext!,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
        alignment: 0.08,
      );
    }
  }

  void _showQuestionPalette(List<Question> questions) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? const Color(0xFF141416) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'প্রশ্ন প্যালেট',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.x, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Legend Row
                    Row(
                      children: [
                        _LegendDot(color: const Color(0xFF059669), label: 'উত্তর দেওয়া (${_userAnswers.length})', isDark: isDark),
                        const SizedBox(width: 12),
                        _LegendDot(color: const Color(0xFFD97706), label: 'ফ্ল্যাগ (${_flaggedIds.length})', isDark: isDark),
                        const SizedBox(width: 12),
                        _LegendDot(color: isDark ? const Color(0xFF52525B) : const Color(0xFF94A3B8), label: 'বাকি (${questions.length - _userAnswers.length})', isDark: isDark),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Grid
                    ConstrainedBox(
                      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.45),
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        child: Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: List.generate(questions.length, (i) {
                            final qId = questions[i].id;
                            final isAnswered = _userAnswers.containsKey(qId);
                            final isFlagged = _flaggedIds.contains(qId);

                            Color bg = isDark ? const Color(0xFF27272A) : const Color(0xFFF1F5F9);
                            Color textColor = isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155);
                            Border? border;

                            if (isFlagged) {
                              bg = const Color(0xFFD97706).withValues(alpha: 0.2);
                              textColor = const Color(0xFFF59E0B);
                              border = Border.all(color: const Color(0xFFD97706), width: 1.5);
                            } else if (isAnswered) {
                              bg = const Color(0xFF059669).withValues(alpha: isDark ? 0.25 : 0.15);
                              textColor = const Color(0xFF059669);
                              border = Border.all(color: const Color(0xFF059669), width: 1.5);
                            }

                            return GestureDetector(
                              onTap: () {
                                Navigator.pop(ctx);
                                _scrollToQuestion(i);
                              },
                              child: Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: bg,
                                  borderRadius: BorderRadius.circular(12),
                                  border: border,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  BanglaNameHelper.toBanglaNumeral(i + 1),
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'HindSiliguri',
                                    color: textColor,
                                  ),
                                ),
                              ),
                            );
                          }),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showSubmitConfirmation(int total, int answered) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final remaining = total - answered;

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: isDark ? const Color(0xFF141416) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFF004633).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.checkCheck, color: Color(0xFF004633), size: 26),
              ),
              const SizedBox(height: 16),
              Text(
                'পরীক্ষা সমাপ্ত করবেন?',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'HindSiliguri',
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _DialogStat(label: 'মোট', value: '$total', color: const Color(0xFF3B82F6), isDark: isDark),
                    _DialogStat(label: 'উত্তর', value: '$answered', color: const Color(0xFF10B981), isDark: isDark),
                    _DialogStat(label: 'বাকি', value: '$remaining', color: const Color(0xFFEF4444), isDark: isDark),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        side: BorderSide(color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFD1D5DB)),
                      ),
                      child: Text(
                        'আরেকটু দেখব',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontWeight: FontWeight.bold,
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _submitExam();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF004633),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text(
                              'হ্যাঁ, জমা দাও',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCancelConfirmation() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF141416) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('পরীক্ষা বাতিল করবে?', style: TextStyle(fontFamily: 'HindSiliguri', fontWeight: FontWeight.bold)),
        content: const Text(
          'এখন বের হয়ে গেলে তোমার উত্তরপত্র জমা হবে না।',
          style: TextStyle(fontFamily: 'HindSiliguri'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('না, ফিরে যাই', style: TextStyle(fontFamily: 'HindSiliguri')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              context.pop();
            },
            child: const Text('হ্যাঁ, বের হন', style: TextStyle(fontFamily: 'HindSiliguri')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final questionsAsync = ref.watch(liveExamQuestionsProvider(widget.examId));

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _showCancelConfirmation();
      },
      child: Scaffold(
        backgroundColor: isDark ? Colors.black : const Color(0xFFF8FAFC),
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: AppBar(
            automaticallyImplyLeading: false,
            backgroundColor: isDark ? const Color(0xFF09090B) : Colors.white,
            elevation: 1,
            surfaceTintColor: Colors.transparent,
            flexibleSpace: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // LEFT: Close & Answered / Total Pill
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(LucideIcons.x, size: 20),
                          onPressed: _showCancelConfirmation,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        ),
                        const SizedBox(width: 4),
                        questionsAsync.maybeWhen(
                          data: (questions) => ObhyashTooltip(
                            message: 'উত্তর দেওয়া প্রশ্ন / মোট প্রশ্নের সংখ্যা',
                            preferredPosition: TooltipPosition.bottom,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${BanglaNameHelper.toBanglaNumeral(_userAnswers.length)} / ${BanglaNameHelper.toBanglaNumeral(questions.length)}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'HindSiliguri',
                                  color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ),
                          orElse: () => const SizedBox(),
                        ),
                      ],
                    ),

                    // MIDDLE: Timer box
                    ObhyashTooltip(
                      message: 'অবশিষ্ট সময়। সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা হবে।',
                      preferredPosition: TooltipPosition.bottom,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: _secondsRemaining < 60
                              ? const Color(0xFFDC2626)
                              : _secondsRemaining < 300
                                  ? (isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB))
                                  : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9)),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: _secondsRemaining < 60
                                ? const Color(0xFFDC2626)
                                : _secondsRemaining < 300
                                    ? (isDark ? const Color(0xFFB45309) : const Color(0xFFFDE68A))
                                    : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.timer_outlined,
                              size: 14,
                              color: _secondsRemaining < 60
                                  ? Colors.white
                                  : _secondsRemaining < 300
                                      ? (isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309))
                                      : (isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569)),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatTime(_secondsRemaining),
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'monospace',
                                color: _secondsRemaining < 60
                                    ? Colors.white
                                    : _secondsRemaining < 300
                                        ? (isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309))
                                        : (isDark ? const Color(0xFFF5F5F5) : const Color(0xFF27272A)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // RIGHT: Palette & Theme toggle
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        questionsAsync.maybeWhen(
                          data: (questions) => ObhyashTooltip(
                            message: 'সকল প্রশ্নের তালিকা',
                            preferredPosition: TooltipPosition.bottom,
                            child: InkWell(
                              onTap: () => _showQuestionPalette(questions),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  LucideIcons.layoutGrid,
                                  size: 16,
                                  color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ),
                          orElse: () => const SizedBox(),
                        ),
                        const SizedBox(width: 6),
                        ObhyashTooltip(
                          message: isDark ? 'লাইট মোড' : 'ডার্ক মোড',
                          preferredPosition: TooltipPosition.bottom,
                          child: InkWell(
                            onTap: () {
                              ref.read(themeModeProvider.notifier).toggle();
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                                size: 16,
                                color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        body: questionsAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: Color(0xFF004633)),
          ),
          error: (e, _) => Center(
            child: Text('Error: $e', style: const TextStyle(fontFamily: 'HindSiliguri')),
          ),
          data: (questions) {
            if (questions.isEmpty) {
              return const Center(
                child: Text('কোনো প্রশ্ন পাওয়া যায়নি।', style: TextStyle(fontFamily: 'HindSiliguri')),
              );
            }

            return ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 120),
              itemCount: questions.length,
              itemBuilder: (context, index) {
                final q = questions[index];
                _itemKeys[index] = GlobalKey();

                return Container(
                  key: _itemKeys[index],
                  margin: const EdgeInsets.only(bottom: 14),
                  child: QuestionCard(
                    question: q,
                    serialNumber: index + 1,
                    selectedOptionIndex: _userAnswers[q.id],
                    isFlagged: _flaggedIds.contains(q.id),
                    isBookmarked: _bookmarkedIds.contains(q.id),
                    onSelectOption: (optIndex) {
                      setState(() {
                        _userAnswers[q.id] = optIndex;
                      });
                    },
                    onToggleFlag: () {
                      setState(() {
                        if (_flaggedIds.contains(q.id)) {
                          _flaggedIds.remove(q.id);
                        } else {
                          _flaggedIds.add(q.id);
                        }
                      });
                    },
                    onToggleBookmark: () => _toggleBookmark(q.id),
                    onReport: () => QuestionReportDialog.show(context, q.id),
                  ),
                );
              },
            );
          },
        ),

        // Bottom Action Floating Submit Bar
        bottomNavigationBar: SafeArea(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF09090B).withValues(alpha: 0.95)
                  : Colors.white.withValues(alpha: 0.95),
              border: Border(
                top: BorderSide(
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: questionsAsync.maybeWhen(
              data: (questions) => SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: () => _showSubmitConfirmation(questions.length, _userAnswers.length),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF004633),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 1,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.send, size: 16, color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        'উত্তরপত্র জমা দাও (${BanglaNameHelper.toBanglaNumeral(_userAnswers.length)}/${BanglaNameHelper.toBanglaNumeral(questions.length)})',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'HindSiliguri',
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              orElse: () => const SizedBox(),
            ),
          ),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  final bool isDark;

  const _LegendDot({required this.color, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            fontFamily: 'HindSiliguri',
            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }
}

class _DialogStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isDark;

  const _DialogStat({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          BanglaNameHelper.toBanglaNumeral(int.tryParse(value) ?? 0),
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            fontFamily: 'HindSiliguri',
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontFamily: 'HindSiliguri',
            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }
}
