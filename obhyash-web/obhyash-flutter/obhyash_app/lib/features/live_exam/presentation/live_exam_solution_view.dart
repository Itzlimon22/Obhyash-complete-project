import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/app_popups.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../exam/presentation/widgets/question_report_dialog.dart';
import '../domain/models.dart';
import '../providers/live_exam_providers.dart';

class LiveExamSolutionView extends ConsumerStatefulWidget {
  final String examId;
  final LiveExam? exam;

  const LiveExamSolutionView({
    super.key,
    required this.examId,
    this.exam,
  });

  @override
  ConsumerState<LiveExamSolutionView> createState() => _LiveExamSolutionViewState();
}

class _LiveExamSolutionViewState extends ConsumerState<LiveExamSolutionView> {
  String _activeFilter = 'all'; // all, correct, wrong, skipped
  final Set<String> _bookmarkedIds = {};

  Future<void> _toggleBookmark(String questionId) async {
    final supabase = Supabase.instance.client;
    final user = supabase.auth.currentUser;
    if (user == null) {
      AppPopups.warning(context, message: 'বুকমার্ক করতে লগইন করুন');
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
        if (mounted) {
          AppPopups.success(context, message: 'রিভিশন তালিকা থেকে সরানো হয়েছে');
        }
      } else {
        await supabase.from('bookmarks').insert({
          'user_id': user.id,
          'question_id': questionId,
          'created_at': DateTime.now().toIso8601String(),
        });
        if (mounted) {
          AppPopups.success(context, message: 'রিভিশন তালিকায় যুক্ত হয়েছে');
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final solutionAsync = ref.watch(liveExamSolutionProvider(widget.examId));

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0C0A09) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? Colors.white : Colors.black87,
          ),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'সমাধান ও ব্যাখ্যা',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: solutionAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF0B6B42)),
        ),
        error: (err, _) => Center(child: Text('Error: $err')),
        data: (data) {
          final questions = data.questions;
          final userAnswers = data.userAnswers;

          int correctCount = 0;
          int wrongCount = 0;
          int skippedCount = 0;
          num score = 0;
          final negativeRate = widget.exam?.negativeMarking.toDouble() ?? 0.25;

          for (final q in questions) {
            final pick = userAnswers[q.id];
            if (pick == null) {
              skippedCount++;
            } else if (pick == q.correctAnswerIndex) {
              correctCount++;
              score += q.points;
            } else {
              wrongCount++;
              score -= (q.points * negativeRate);
            }
          }

          final finalScore = score < 0 ? 0 : score;

          final filteredQuestions = questions.where((q) {
            final pick = userAnswers[q.id];
            if (_activeFilter == 'correct') return pick != null && pick == q.correctAnswerIndex;
            if (_activeFilter == 'wrong') return pick != null && pick != q.correctAnswerIndex;
            if (_activeFilter == 'skipped') return pick == null;
            return true;
          }).toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Summary Row
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatColumn('প্রাপ্ত নম্বর', '$finalScore', const Color(0xFF0B6B42)),
                      _buildStatColumn('সঠিক', '$correctCount', const Color(0xFF10B981)),
                      _buildStatColumn('ভুল', '$wrongCount', const Color(0xFFEF4444)),
                      _buildStatColumn('অনুত্তরিত', '$skippedCount', Colors.grey),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Filter Tabs
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('all', 'সবগুলো (${questions.length})', isDark),
                      const SizedBox(width: 8),
                      _buildFilterChip('correct', 'সঠিক ($correctCount)', isDark),
                      const SizedBox(width: 8),
                      _buildFilterChip('wrong', 'ভুল ($wrongCount)', isDark),
                      const SizedBox(width: 8),
                      _buildFilterChip('skipped', 'অনুত্তরিত ($skippedCount)', isDark),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Question Review Cards
                if (filteredQuestions.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(32),
                    child: Center(
                      child: Text(
                        'কোনো প্রশ্ন পাওয়া যায়নি',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  )
                else
                  ...filteredQuestions.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final q = entry.value;
                    final userPick = userAnswers[q.id];

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      child: QuestionCard(
                        question: q,
                        serialNumber: idx + 1,
                        selectedOptionIndex: userPick,
                        readOnly: true,
                        showFeedback: true,
                        showAnswer: true,
                        isFlagged: false,
                        onSelectOption: (_) {},
                        onToggleFlag: () {},
                        onReport: () => QuestionReportDialog.show(context, q.id),
                        isBookmarked: _bookmarkedIds.contains(q.id),
                        onToggleBookmark: () => _toggleBookmark(q.id),
                      ),
                    );
                  }),
                const SizedBox(height: 30),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatColumn(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }

  Widget _buildFilterChip(String filterId, String label, bool isDark) {
    final isSelected = _activeFilter == filterId;
    return GestureDetector(
      onTap: () {
        setState(() {
          _activeFilter = filterId;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF0B6B42)
              : (isDark ? const Color(0xFF1C1C1E) : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF0B6B42)
                : (isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7)),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
          ),
        ),
      ),
    );
  }
}
