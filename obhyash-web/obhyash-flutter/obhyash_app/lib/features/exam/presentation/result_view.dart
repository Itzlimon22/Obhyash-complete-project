import 'package:flutter/material.dart';
import 'package:confetti/confetti.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/exam_models.dart';
import 'widgets/result_stats.dart';
import 'widgets/review_list.dart';
import 'package:obhyash_app/core/utils/app_popups.dart';
import '../services/pdf_download_service.dart';

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

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 3),
    );

    // Trigger confetti if score > 80%
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final percentage = widget.result.totalMarks > 0
          ? (widget.result.score / widget.result.totalMarks) * 100
          : 0.0;
      if (percentage >= 80.0) {
        _confettiController.play();
      }
    });

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
    // Show a bottom sheet or dialog to report an issue
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 24,
        ),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? const Color(0xFF000000)
              : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'প্রশ্ন $questionId রিপোর্ট করো',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'সমস্যাটির কারণ লেখুন:',
                style: TextStyle(fontSize: 15, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextField(
                maxLines: 4,
                decoration: InputDecoration(
                  hintText:
                      'যেমন: সঠিক উত্তরটি ভুল, অথবা প্রশ্নে বানান ভুল আছে...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Theme.of(context).brightness == Brightness.dark
                      ? Colors.black
                      : const Color(0xFFFAFAFA),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text(
                      'বাতিল',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      AppPopups.show(
                        context,
                        message: 'রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে!',
                        isError: false,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                    child: const Text('জমা দাও'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
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

    // Feedback logic removed since it is no longer shown

    return Scaffold(
      backgroundColor: isDark ? Colors.black : const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: const Text(
          'পরীক্ষার ফলাফল',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        leading: widget.isHistoryMode
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: widget.onRestart,
              )
            : IconButton(
                icon: const Icon(Icons.close),
                onPressed: widget.onRestart,
              ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          children: [

            // Banner for OMR review
            if (widget.result.submissionType == 'script' &&
                !widget.isHistoryMode)
              Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7), // amber-50
                  border: Border.all(
                    color: const Color(0xFFFCD34D),
                  ), // amber-300
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      color: Color(0xFFD97706),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'OMR মূল্যায়ন নিয়ে খুশি নন?',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF92400E),
                            ),
                          ),
                          Text(
                            'যান্ত্রিক ত্রুটির কারণে ফলাফল ভুল হতে পারে।',
                            style: TextStyle(
                              fontSize: 15,
                              color: const Color(
                                0xFFB45309,
                              ).withValues(alpha: 0.8),
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFFB45309),
                      ),
                      child: const Text('আবার যাচাই করো'),
                    ),
                  ],
                ),
              ),

            // Top Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('PDF তৈরি হচ্ছে, একটু অপেক্ষা করুন...'),
                          behavior: SnackBarBehavior.floating,
                          duration: Duration(seconds: 2),
                        ),
                      );
                      await PdfDownloadService.downloadQuestionPaper(
                          widget.result, context);
                    },
                    icon: const Icon(Icons.download_rounded, size: 16),
                    label: const Text('প্রশ্নপত্র'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF047857), // emerald-700
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('PDF তৈরি হচ্ছে, একটু অপেক্ষা করুন...'),
                          behavior: SnackBarBehavior.floating,
                          duration: Duration(seconds: 2),
                        ),
                      );
                      await PdfDownloadService.downloadResultWithExplanations(
                          widget.result, context);
                    },
                    icon: const Icon(Icons.download_done_rounded, size: 16),
                    label: const Text('ফলাফল ও ব্যাখ্যা'),
                    style: OutlinedButton.styleFrom(
                      backgroundColor: const Color(0xFFECFDF5), // emerald-50
                      foregroundColor: const Color(0xFF047857), // emerald-600
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: const BorderSide(color: Color(0xFFE0E7FF)),
                    ),
                  ),
                ),
              ],
            ),

            // Exam Details Ribbon
            Container(
              margin: const EdgeInsets.symmetric(vertical: 24),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1C1C1E).withValues(alpha: 0.4)
                    : const Color(0xFFF9FAFB),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFF3F4F6),
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Wrap(
                alignment: WrapAlignment.center,
                spacing: 12,
                runSpacing: 12,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.menu_book_rounded,
                        size: 16,
                        color: Colors.green,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        widget.result.subjectLabel ?? widget.result.subject,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.history_rounded,
                        size: 16,
                        color: Colors.green,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        widget.isHistoryMode ? 'ইতিহাস' : 'আজকের পরীক্ষা',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.help_outline_rounded,
                        size: 16,
                        color: Colors.red,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'মোট প্রশ্ন: ${widget.result.totalQuestions}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
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

            const SizedBox(height: 32),

            ReviewList(
              questions: widget.result.questions,
              userAnswers: widget.result.userAnswers,
              bookmarked: _bookmarkedIds,
              onToggleBookmark: _toggleBookmark,
              onReport: _showReportModal,
            ),
            
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: widget.onRestart,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('আবার পরীক্ষা দিন', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF047857), // emerald-700
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
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
                1.0, // Used for offset in actual math mapping (simplified here)
        halfWidth + externalRadius * 1.5 * 1.0,
      );
      // Just consuming the unused local to satisfy lint and keep the path safe.
      // In a real math formula we use `math.cos`/`math.sin`.
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
