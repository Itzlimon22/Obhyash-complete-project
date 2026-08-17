import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../providers/exam_provider.dart';
import '../services/pdf_download_service.dart';
import '../domain/exam_models.dart';
import 'exam_celebration_view.dart';
import 'widgets/question_card.dart';
import 'widgets/exam_scope_header.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';
import 'package:obhyash_app/core/utils/bangla_name_helper.dart';
import 'package:obhyash_app/core/providers/theme_provider.dart';
import '../../../core/presentation/widgets/obhyash_tooltip.dart';

class ExamRunnerView extends ConsumerStatefulWidget {
  const ExamRunnerView({super.key});

  @override
  ConsumerState<ExamRunnerView> createState() => _ExamRunnerViewState();
}

class _ExamRunnerViewState extends ConsumerState<ExamRunnerView> with WidgetsBindingObserver {
  int _backgroundWarnings = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Do NOT automatically begin timer. 
    // Wait for user to read instructions and click "Start Exam".
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState appLifecycleState) {
    final examState = ref.read(examEngineProvider);
    if (examState.appState == AppState.active) {
      if (appLifecycleState == AppLifecycleState.paused) {
        _backgroundWarnings++;
      } else if (appLifecycleState == AppLifecycleState.resumed) {
        // 1. Immediately synchronize timer to absolute timestamp (prevent background freeze)
        ref.read(examEngineProvider.notifier).syncTimerOnResume();

        // 2. Anti-cheat integrity check
        if (_backgroundWarnings == 1) {
          _showCheatingWarning();
        } else if (_backgroundWarnings >= 2) {
          _autoSubmitDueToCheating();
        }
      }
    }
  }

  String _toBn(int n) {
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
    };
    return n.toString().split('').map((c) => m[c] ?? c).join();
  }

  void _showCheatingWarning() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Dialog(
          backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
              width: 1,
            ),
          ),
          insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDC2626).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFDC2626).withValues(alpha: 0.3),
                        width: 1.5,
                      ),
                    ),
                    child: const Icon(
                      LucideIcons.alertOctagon,
                      color: Color(0xFFEF4444),
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'সতর্কতা!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'তুমি পরীক্ষা চলাকালীন অ্যাপ থেকে বের হয়ে গিয়েছিলে। এটি পরীক্ষার নিয়ম-বহির্ভূত কাজ। এরপর পুনরায় অ্যাপ থেকে বের হলে তোমার পরীক্ষাটি স্বয়ংক্রিয়ভাবে বাতিল ও সাবমিট হয়ে যাবে।',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.5,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: () => Navigator.pop(ctx),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFDC2626), Color(0xFFB91C1C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFDC2626).withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'আমি বুঝতে পেরেছি',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _autoSubmitDueToCheating() {
    ref.read(examEngineProvider.notifier).submitExam();
    AppPopups.show(
      context,
      message: 'নিয়ম ভঙ্গের কারণে পরীক্ষাটি স্বয়ংক্রিয়ভাবে সাবমিট করা হয়েছে!',
      isError: true,
    );
  }

  void _showNavigationWarning() {
    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Dialog(
          backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
              width: 1,
            ),
          ),
          insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEA580C).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFEA580C).withValues(alpha: 0.3),
                        width: 1.5,
                      ),
                    ),
                    child: const Icon(
                      LucideIcons.alertTriangle,
                      color: Color(0xFFF97316),
                      size: 28,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'সতর্কতা',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white : const Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'পরীক্ষা চলাকালীন অবস্থায় বের হওয়া যাবে না। বের হতে চাইলে পরীক্ষাটি জমা দিন। আপনি কি পরীক্ষা জমা দিয়ে বের হতে চান?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.5,
                    fontFamily: 'HindSiliguri',
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => Navigator.pop(ctx),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF27272A) : const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'চালিয়ে যাও',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF4B5563),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.pop(ctx);
                          ref.read(examEngineProvider.notifier).submitExam();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF004633), Color(0xFF00664B)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF004633).withValues(alpha: 0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            'জমা দাও',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showSubmitConfirmation(int totalQuestions, int answeredQuestions) {
    final remaining = totalQuestions - answeredQuestions;
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Dialog(
          backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE5E7EB),
              width: 1,
            ),
          ),
          insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Title
                Text(
                  'খাতা জমা দিবে?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Anek Bangla',
                    color: isDark ? Colors.white : const Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 18),

                // Stats Snapshot Row
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF27272A).withValues(alpha: 0.5)
                        : const Color(0xFFF4F4F5),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF3F3F46).withValues(alpha: 0.4)
                          : const Color(0xFFE4E4E7),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        children: [
                          Text(
                            'উত্তর দেওয়া',
                            style: TextStyle(
                              fontSize: 12,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF71717A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${_toBn(answeredQuestions)}/${_toBn(totalQuestions)}',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF10B981),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        width: 1,
                        height: 28,
                        color: isDark
                            ? const Color(0xFF3F3F46)
                            : const Color(0xFFE4E4E7),
                      ),
                      Column(
                        children: [
                          Text(
                            'বাকি আছে',
                            style: TextStyle(
                              fontSize: 12,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFA1A1AA)
                                  : const Color(0xFF71717A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _toBn(remaining),
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: remaining > 0
                                  ? const Color(0xFFEF4444)
                                  : const Color(0xFF10B981),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => Navigator.pop(ctx),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF27272A)
                                : const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF3F3F46)
                                  : const Color(0xFFE5E7EB),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'না, পরীক্ষা দিবো',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: isDark
                                  ? const Color(0xFFD4D4D8)
                                  : const Color(0xFF4B5563),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.pop(ctx);
                          ref.read(examEngineProvider.notifier).submitExam();
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF004633), Color(0xFF00664B)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF004633).withValues(alpha: 0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            'হ্যাঁ, জমা দাও',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'HindSiliguri',
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatTime(int seconds) {
    if (seconds <= 0) return "00:00";
    final m = (seconds / 60).floor();
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(examEngineProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Navigate to ExamCelebrationView when exam is completed
    if (state.appState == AppState.completed ||
        state.appState == AppState.submitted) {
      final result = state.completedResult;
      if (result != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (routeContext) => ExamCelebrationView(
                  result: result,
                  onRestart: () => Navigator.of(routeContext).pop(),
                ),
              ),
            );
          }
        });
      }
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Safety checks
    if (state.appState == AppState.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (state.questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('No questions found.')),
      );
    }

    if (state.appState == AppState.instructions) {
      return _ExamInstructionScreen(
        state: state,
        isDark: isDark,
        onStart: () => ref.read(examEngineProvider.notifier).beginTimer(),
      );
    }

    final answeredCount = state.userAnswers.length;
    final totalCount = state.questions.length;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) _showNavigationWarning();
      },
      child: Scaffold(
        backgroundColor: isDark ? Colors.black : const Color(0xFFF8FAFC),
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: AppBar(
            automaticallyImplyLeading: false,
            backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
            elevation: 1,
            flexibleSpace: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // LEFT: Answered / Total
                    ObhyashTooltip(
                      message: 'উত্তর দেওয়া প্রশ্ন / মোট প্রশ্নের সংখ্যা',
                      preferredPosition: TooltipPosition.bottom,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '$answeredCount / $totalCount',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ),
                    
                    // MIDDLE: Timer box
                    ObhyashTooltip(
                      message: 'অবশিষ্ট সময়। সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।',
                      preferredPosition: TooltipPosition.bottom,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: state.timeLeft < 60
                              ? const Color(0xFFDC2626) // Critical
                              : state.timeLeft < 300
                                  ? (isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB)) // Warning
                                  : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9)), // Normal
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: state.timeLeft < 60
                                ? const Color(0xFFDC2626)
                                : state.timeLeft < 300
                                    ? (isDark ? const Color(0xFFB45309) : const Color(0xFFFDE68A))
                                    : (isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0)),
                          ),
                          boxShadow: state.timeLeft < 60 
                              ? [BoxShadow(color: const Color(0xFFDC2626).withValues(alpha: 0.3), blurRadius: 8, spreadRadius: 2)]
                              : [],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.timer_outlined,
                              size: 14,
                              color: state.timeLeft < 60
                                  ? Colors.white
                                  : state.timeLeft < 300
                                      ? (isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309))
                                      : (isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569)),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatTime(state.timeLeft),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'monospace',
                                color: state.timeLeft < 60
                                    ? Colors.white
                                    : state.timeLeft < 300
                                        ? (isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309))
                                        : (isDark ? const Color(0xFFF5F5F5) : const Color(0xFF27272A)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    // RIGHT: Download & Theme Button
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        ObhyashTooltip(
                          message: 'অফলাইন প্রশ্নপত্র PDF ডাউনলোড করো',
                          preferredPosition: TooltipPosition.bottom,
                          child: InkWell(
                            onTap: () async {
                              AppPopups.info(
                                context,
                                message: 'PDF তৈরি হচ্ছে, একটু অপেক্ষা করো...',
                              );
                              
                              final dummyResult = ExamResult(
                                id: 'dummy',
                                subject: state.examDetails?.subject ?? 'general',
                                subjectLabel: state.examDetails?.subjectLabel,
                                examType: state.examDetails?.examType ?? '',
                                date: DateTime.now().toIso8601String(),
                                score: 0,
                                totalMarks: state.questions.fold(0.0, (sum, q) => sum + q.points),
                                totalQuestions: state.questions.length,
                                correctCount: 0,
                                wrongCount: 0,
                                timeTaken: 0,
                                negativeMarking: state.examDetails?.negativeMarking ?? 0.0,
                                questions: state.questions,
                                flaggedQuestions: [],
                                submissionType: 'online',
                                status: 'active',
                                userAnswers: {},
                              );
                              
                              await PdfDownloadService.downloadQuestionPaper(dummyResult, context);
                            },
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Icon(
                                Icons.download_rounded,
                                size: 16,
                                color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        // Theme Toggle Button
                        ObhyashTooltip(
                          message: isDark ? 'লাইট মোড' : 'ডার্ক মোড',
                          preferredPosition: TooltipPosition.bottom,
                          child: InkWell(
                            onTap: () {
                              ref.read(themeModeProvider.notifier).toggle();
                            },
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
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

        body: ListView.builder(
          padding: const EdgeInsets.fromLTRB(
            16,
            24,
            16,
            120,
          ), // Exra padding for bottom bar
          itemCount: state.questions.length,
          itemBuilder: (context, index) {
            final q = state.questions[index];
            return QuestionCard(
              question: q,
              serialNumber: index + 1,
              selectedOptionIndex: state.userAnswers[q.id],
              isFlagged: state.flaggedQuestions.contains(q.id),
              onSelectOption: (optIndex) {
                ref.read(examEngineProvider.notifier).setAnswer(q.id, optIndex);
              },
              onToggleFlag: () {
                ref.read(examEngineProvider.notifier).toggleFlag(q.id);
              },
              onReport: () {
                AppPopups.show(
                  context,
                  message: 'Report generated.',
                  isError: false,
                );
              },
              isBookmarked: state.bookmarkedQuestions.contains(q.id),
              onToggleBookmark: () {
                ref.read(examEngineProvider.notifier).toggleBookmark(q.id);
              },
            );
          },
        ),

        // Bottom Action Bar
        bottomNavigationBar: SafeArea(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF000000).withValues(alpha: 0.95)
                  : Colors.white.withValues(alpha: 0.95),
              border: Border(
                top: BorderSide(
                  color: isDark
                      ? const Color(0xFF1C1C1E)
                      : const Color(0xFFE5E5E5),
                ),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () {
                    if (answeredCount == totalCount) {
                      ref.read(examEngineProvider.notifier).submitExam();
                    } else {
                      _showSubmitConfirmation(totalCount, answeredCount);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF004633), // Deep signature emerald green
                    foregroundColor: Colors.white,
                    elevation: 0,
                    minimumSize: const Size(0, 35),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    padding: const EdgeInsets.symmetric(vertical: 6.5, horizontal: 22),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'জমা দাও',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14.5,
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Ultra-Premium Exam Instruction Screen ───────────────────────────────────

class _ExamInstructionScreen extends StatefulWidget {
  final ExamEngineState state;
  final bool isDark;
  final VoidCallback onStart;

  const _ExamInstructionScreen({
    required this.state,
    required this.isDark,
    required this.onStart,
  });

  @override
  State<_ExamInstructionScreen> createState() => _ExamInstructionScreenState();
}

class _ExamInstructionScreenState extends State<_ExamInstructionScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseCtrl;
  late final Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final details = widget.state.examDetails;
    final subjectTitle = BanglaNameHelper.formatSubject(
      details?.subject,
      details?.subjectLabel,
    );
    final duration = details?.durationMinutes ?? 0;
    final totalQ = details?.totalQuestions ?? widget.state.questions.length;
    final negMark = details?.negativeMarking ?? 0.0;

    final rawChapters = (details?.chapters != null &&
            details!.chapters!.trim().isNotEmpty &&
            details.chapters != 'All')
        ? details.chapters!
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList()
        : widget.state.questions
            .map((q) => q.chapter.trim())
            .where((c) => c.isNotEmpty && c != 'All')
            .toSet()
            .toList();

    // Sort chapters in canonical academic order (১ম অধ্যায় -> ২য় অধ্যায় -> ৩য় অধ্যায়)
    rawChapters.sort((a, b) {
      final idxA = BanglaNameHelper.getChapterSortIndex(a, a);
      final idxB = BanglaNameHelper.getChapterSortIndex(b, b);
      if (idxA != idxB) return idxA.compareTo(idxB);
      return a.compareTo(b);
    });
    final chaptersList = rawChapters;

    final topicsList = (details?.topics != null &&
            details!.topics!.trim().isNotEmpty &&
            details.topics != 'All')
        ? details.topics!
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList()
        : <String>[];

    final bg = isDark ? const Color(0xFF09090B) : const Color(0xFFF4F6FA);
    final cardBg = isDark ? const Color(0xFF111113) : Colors.white;
    final border = isDark ? const Color(0xFF222226) : const Color(0xFFE4E9F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final accent = const Color(0xFF059669);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF09090B) : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'পরীক্ষার নির্দেশাবলী',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'HindSiliguri',
            color: textPrimary,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: border, height: 1),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [

                    // ── 1. Clean Scope Header Row ──────────────────────────────
                    ExamScopeHeader(
                      subjectName: subjectTitle,
                      chapters: chaptersList,
                      topics: topicsList,
                      isDark: isDark,
                      margin: const EdgeInsets.only(bottom: 14),
                    ),

                    // ── 2. Stat Ribbon ────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 16, horizontal: 8),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(
                                alpha: isDark ? 0.25 : 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          _StatCell(
                            label: 'সময়সীমা',
                            value:
                                '${BanglaNameHelper.toBanglaNumeral(duration)} মিনিট',
                            isDark: isDark,
                          ),
                          _StatDivider(isDark: isDark),
                          _StatCell(
                            label: 'মোট প্রশ্ন',
                            value:
                                '${BanglaNameHelper.toBanglaNumeral(totalQ)}টি MCQ',
                            isDark: isDark,
                          ),
                          _StatDivider(isDark: isDark),
                          _StatCell(
                            label: 'নেগেটিভ',
                            value: negMark > 0
                                ? '-${BanglaNameHelper.toBanglaNumeral(negMark)}'
                                : 'নেই',
                            isDark: isDark,
                          ),
                          _StatDivider(isDark: isDark),
                          _StatCell(
                            label: 'পূর্ণমান',
                            value:
                                '${BanglaNameHelper.toBanglaNumeral(totalQ)} নম্বর',
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ── 3. Rules Card — Timeline Style ────────────────────
                    Container(
                      padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(
                                alpha: isDark ? 0.25 : 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Section header
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  color: accent.withValues(
                                      alpha: isDark ? 0.18 : 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(LucideIcons.shieldAlert,
                                    size: 15, color: accent),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'গুরুত্বপূর্ণ নির্দেশনাবলী',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'HindSiliguri',
                                  color: textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),
                          _RuleItem(
                            icon: LucideIcons.checkCircle2,
                            iconColor: const Color(0xFF10B981),
                            title: 'সঠিক উত্তর নির্বাচন',
                            desc: 'প্রতিটি প্রশ্নে ৪টি অপশন থাকবে। পছন্দের অপশনে ট্যাপ করে উত্তর দাও। সাবমিটের আগে যেকোনো সময় পরিবর্তন করা যাবে।',
                            isDark: isDark,
                            isLast: false,
                          ),
                          _RuleItem(
                            icon: LucideIcons.timer,
                            iconColor: const Color(0xFF3B82F6),
                            title: 'টাইমার ও স্বয়ংক্রিয় সাবমিট',
                            desc: 'স্ক্রিনের শীর্ষে কাউন্টডাউন থাকবে। সময় শেষ হলে পরীক্ষা নিজেই সাবমিট হয়ে রেজাল্ট দেখাবে।',
                            isDark: isDark,
                            isLast: false,
                          ),
                          _RuleItem(
                            icon: LucideIcons.layoutGrid,
                            iconColor: const Color(0xFF8B5CF6),
                            title: 'প্রশ্ন প্যালেট জাম্প',
                            desc: 'উপরের প্রশ্ন নম্বরে ট্যাপ করে সরাসরি যেকোনো প্রশ্নে চলে যাও।',
                            isDark: isDark,
                            isLast: false,
                          ),
                          _RuleItem(
                            icon: LucideIcons.alertTriangle,
                            iconColor: const Color(0xFFEF4444),
                            title: 'অ্যাপ ত্যাগ সতর্কতা',
                            desc: 'পরীক্ষা চলাকালে অ্যাপ থেকে বের বা ব্যাকগ্রাউন্ডে গেলে পরীক্ষা অকার্যকর হতে পারে।',
                            isDark: isDark,
                            isLast: true,
                            isWarning: true,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── 4. Bottom Glow CTA ────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF09090B) : Colors.white,
                border: Border(
                  top: BorderSide(color: border, width: 1),
                ),
              ),
              child: AnimatedBuilder(
                animation: _pulseAnim,
                builder: (context, child) {
                  final glowOpacity = 0.22 + (_pulseAnim.value * 0.22);
                  return Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF059669).withValues(alpha: glowOpacity),
                          blurRadius: 20 + (_pulseAnim.value * 12),
                          spreadRadius: 0,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: child,
                  );
                },
                child: SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: widget.onStart,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF004633),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'পরীক্ষা শুরু করো',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'HindSiliguri',
                            color: Colors.white,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.arrowRight,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Stat Cell (for horizontal ribbon) ────────────────────────────────────────

class _StatCell extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;

  const _StatCell({
    required this.label,
    required this.value,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final subColor =
        isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: subColor,
              height: 1.2,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 5),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              fontFamily: 'HindSiliguri',
              color: textColor,
              height: 1.1,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _StatDivider extends StatelessWidget {
  final bool isDark;
  const _StatDivider({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 44,
      color: isDark ? const Color(0xFF27272A) : const Color(0xFFE9EFF6),
    );
  }
}

// ── Rule Item — timeline style ────────────────────────────────────────────────

class _RuleItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String desc;
  final bool isDark;
  final bool isLast;
  final bool isWarning;

  const _RuleItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.desc,
    required this.isDark,
    this.isLast = false,
    this.isWarning = false,
  });

  @override
  Widget build(BuildContext context) {
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSub =
        isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569);
    final lineColor =
        isDark ? const Color(0xFF27272A) : const Color(0xFFE4E9F0);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: isDark ? 0.18 : 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: iconColor.withValues(alpha: isDark ? 0.25 : 0.15),
                  ),
                ),
                child: Icon(icon, size: 16, color: iconColor),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 1.5,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      color: lineColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(width: 12),

          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 2),
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'HindSiliguri',
                      color: isWarning
                          ? const Color(0xFFEF4444)
                          : textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    desc,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontFamily: 'HindSiliguri',
                      color: textSub,
                      height: 1.45,
                    ),
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
