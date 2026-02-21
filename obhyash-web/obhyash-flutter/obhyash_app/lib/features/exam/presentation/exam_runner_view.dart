import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/exam_provider.dart';
import 'widgets/question_card.dart';
import 'widgets/exam_grid_sheet.dart';

class ExamRunnerView extends ConsumerStatefulWidget {
  const ExamRunnerView({super.key});

  @override
  ConsumerState<ExamRunnerView> createState() => _ExamRunnerViewState();
}

class _ExamRunnerViewState extends ConsumerState<ExamRunnerView> {
  @override
  void initState() {
    super.initState();
    // Begin timer safely after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(examEngineProvider.notifier).beginTimer();
    });
  }

  void _showNavigationWarning() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('সতর্কতা!'),
        content: const Text(
          'পরীক্ষা চলাকালীন অবস্থায় বের হতে পারবেন না। বের হতে হলে আগে খাতা জমা দিন।',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('বন্ধ করুন'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // Submit exam then pop
              ref.read(examEngineProvider.notifier).submitExam().then((_) {
                Navigator.pop(context);
              });
            },
            child: const Text(
              'জমা দিন ও বের হোন',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  void _showSubmitConfirmation(int totalQuestions, int answeredQuestions) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('খাতা জমা দিতে চান?'),
        content: Text(
          'আপনি $totalQuestions টি প্রশ্নের মধ্যে $answeredQuestions টির উত্তর দিয়েছেন। '
          '${totalQuestions - answeredQuestions} টি প্রশ্নের উত্তর দেওয়া বাকি আছে।',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('না, পরীক্ষা দিবো'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(examEngineProvider.notifier).submitExam();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: const Text('হ্যাঁ, জমা দিন'),
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

    // Redirect mapping for graceful finish
    if (state.appState == AppState.completed ||
        state.appState == AppState.submitted) {
      // Typically we use go_router but here we can just show a completed screen or pop
      // I'll show a simple placeholder or pop directly to results
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.check_circle_outline,
                color: Colors.green,
                size: 80,
              ),
              const SizedBox(height: 16),
              const Text(
                'পরীক্ষা সম্পন্ন হয়েছে!',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  // navigate out or view result
                  Navigator.pop(context); // Go back out of Exam Shell
                },
                child: const Text('ড্যাশবোর্ডে ফিরে যান'),
              ),
            ],
          ),
        ),
      );
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

    final answeredCount = state.userAnswers.length;
    final totalCount = state.questions.length;

    return WillPopScope(
      onWillPop: () async {
        _showNavigationWarning();
        return false;
      },
      child: Scaffold(
        backgroundColor: isDark ? Colors.black : const Color(0xFFF8FAFC),
        appBar: AppBar(
          automaticallyImplyLeading: false,
          backgroundColor: isDark ? const Color(0xFF171717) : Colors.white,
          elevation: 1,
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: _showNavigationWarning,
          ),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      state.examDetails?.subjectLabel ?? 'Exam',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '$answeredCount / $totalCount Answered',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF737373),
                      ),
                    ),
                  ],
                ),
              ),
              // Timer
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: state.timeLeft < 300
                      ? const Color(0xFFFEF2F2)
                      : (isDark
                            ? const Color(0xFF262626)
                            : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: state.timeLeft < 300
                        ? const Color(0xFFFCA5A5)
                        : Colors.transparent,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.timer_outlined,
                      size: 16,
                      color: state.timeLeft < 300
                          ? const Color(0xFFEF4444)
                          : (isDark
                                ? const Color(0xFFD4D4D4)
                                : const Color(0xFF475569)),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _formatTime(state.timeLeft),
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                        color: state.timeLeft < 300
                            ? const Color(0xFFEF4444)
                            : (isDark
                                  ? const Color(0xFFF5F5F5)
                                  : const Color(0xFF334155)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
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
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Report generated.')),
                );
              },
              isBookmarked:
                  false, // Could integrate bookmark tracking here later
              onToggleBookmark: () {},
            );
          },
        ),

        // Bottom Action Bar
        bottomNavigationBar: SafeArea(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF171717).withOpacity(0.9)
                  : Colors.white.withOpacity(0.9),
              border: Border(
                top: BorderSide(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFE5E5E5),
                ),
              ),
            ),
            child: Row(
              children: [
                // Grid Menu Button
                Expanded(
                  flex: 1,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        backgroundColor: Colors.transparent,
                        isScrollControlled: true,
                        builder: (ctx) => ExamGridSheet(
                          questions: state.questions,
                          userAnswers: state.userAnswers,
                          flaggedQuestions: state.flaggedQuestions,
                          onJumpToQuestion: (index) {
                            Navigator.pop(ctx);
                            // Real scroll implementation requires ScrollController keys, mock for now
                          },
                        ),
                      );
                    },
                    icon: const Icon(Icons.grid_view_rounded, size: 20),
                    label: const Text(
                      'Menu',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Submit Button
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () =>
                        _showSubmitConfirmation(totalCount, answeredCount),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE11D48), // rose-600
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'পরীক্ষা শেষ করো',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
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
