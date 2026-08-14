import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/exam_provider.dart';
import '../services/pdf_download_service.dart';
import '../domain/exam_models.dart';
import 'result_view.dart';
import 'widgets/question_card.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';
import 'package:obhyash_app/core/providers/theme_provider.dart';

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
        if (_backgroundWarnings == 1) {
          _showCheatingWarning();
        } else if (_backgroundWarnings >= 2) {
          _autoSubmitDueToCheating();
        }
      }
    }
  }

  void _showCheatingWarning() {
    showDialog(
      context: context,
      barrierDismissible: false, // Must click the button
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.warning_rounded, color: Colors.red, size: 32),
            const SizedBox(width: 8),
            const Expanded(
              child: Text('সতর্কতা!', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
        content: const Text(
          'আপনি পরীক্ষা চলাকালীন অ্যাপ থেকে বের হয়ে গিয়েছিলেন। এটি পরীক্ষার নিয়ম-বহির্ভূত কাজ। এরপর পুনরায় অ্যাপ থেকে বের হলে আপনার পরীক্ষাটি স্বয়ংক্রিয়ভাবে বাতিল ও সাবমিট হয়ে যাবে।',
          style: TextStyle(fontSize: 16, height: 1.4),
        ),
        actionsPadding: const EdgeInsets.all(16),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('আমি বুঝতে পেরেছি', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
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
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
            const SizedBox(width: 8),
            const Text('সতর্কতা', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'পরীক্ষা চলাকালীন অবস্থায় বের হওয়া যাবে না। বের হতে চাইলে পরীক্ষাটি জমা দিন। আপনি কি পরীক্ষা জমা দিয়ে বের হতে চান?',
          style: TextStyle(fontSize: 16, height: 1.4),
        ),
        actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('চালিয়ে যাও', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(examEngineProvider.notifier).submitExam();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('জমা দাও', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showSubmitConfirmation(int totalQuestions, int answeredQuestions) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.help_outline_rounded, color: Colors.blue, size: 28),
            const SizedBox(width: 8),
            const Text('খাতা জমা দিবে?', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'তুমি $totalQuestions টি প্রশ্নের মধ্যে মাত্র $answeredQuestions টির উত্তর দিয়েছো। '
          'এখনো ${totalQuestions - answeredQuestions} টি প্রশ্ন বাকি আছে। নিশ্চিত জমা দিতে চাও?',
          style: const TextStyle(fontSize: 16, height: 1.4),
        ),
        actionsPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('না, পরীক্ষা দিবো', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(examEngineProvider.notifier).submitExam();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('হ্যাঁ, জমা দাও', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
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

    // Navigate to ResultView when exam is completed
    if (state.appState == AppState.completed ||
        state.appState == AppState.submitted) {
      final result = state.completedResult;
      if (result != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (routeContext) => ResultView(
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
      return Scaffold(
        backgroundColor: isDark ? Colors.black : const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text('নির্দেশাবলী'),
          backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.menu_book, size: 64, color: isDark ? Colors.white70 : Colors.black54),
              const SizedBox(height: 24),
              Text(
                'পরীক্ষার নিয়মাবলী',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 32),
              _InstructionRow(
                icon: Icons.timer,
                text: 'সময়: ${state.examDetails?.durationMinutes ?? 0} মিনিট',
                isDark: isDark,
              ),
              const SizedBox(height: 16),
              _InstructionRow(
                icon: Icons.assignment,
                text: 'মোট প্রশ্ন: ${state.examDetails?.totalQuestions ?? 0}',
                isDark: isDark,
              ),
              const SizedBox(height: 16),
              _InstructionRow(
                icon: Icons.warning,
                text: 'নেগেটিভ মার্কিং: ${(state.examDetails?.negativeMarking ?? 0) > 0 ? 'হ্যাঁ' : 'না'}',
                isDark: isDark,
              ),
              const SizedBox(height: 16),
              _InstructionRow(
                icon: Icons.block,
                text: 'পরীক্ষা চলাকালীন অ্যাপ থেকে বের হওয়া যাবে না।',
                isDark: isDark,
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () {
                  ref.read(examEngineProvider.notifier).beginTimer();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'পরীক্ষা শুরু করো',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
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
                    Container(
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
                    
                    // MIDDLE: Timer box
                    Container(
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
                    
                    // RIGHT: Download & Theme Button
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () async {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('PDF তৈরি হচ্ছে, একটু অপেক্ষা করুন...'),
                                behavior: SnackBarBehavior.floating,
                                duration: Duration(seconds: 2),
                              ),
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
                        const SizedBox(width: 6),
                        // Theme Toggle Button
                        InkWell(
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
            padding: const EdgeInsets.symmetric(vertical: 8),
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
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
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
                    backgroundColor: const Color(0xFF059669), // Deep green
                    foregroundColor: Colors.white,
                    elevation: 4,
                    shadowColor: const Color(0xFF059669).withValues(alpha: 0.4),
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 24),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.check_circle_outline, size: 18),
                      SizedBox(width: 6),
                      Text(
                        'পরীক্ষা শেষ করো',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ],
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

class _InstructionRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final bool isDark;

  const _InstructionRow({
    required this.icon,
    required this.text,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: isDark ? const Color(0xFF34D399) : const Color(0xFF059669), size: 24),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 18,
              color: isDark ? Colors.white70 : Colors.black87,
            ),
           maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }
}
