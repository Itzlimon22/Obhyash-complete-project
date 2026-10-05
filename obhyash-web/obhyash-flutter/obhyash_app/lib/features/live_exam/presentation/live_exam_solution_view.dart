import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/app_popups.dart';
import '../../../core/presentation/widgets/pro_upgrade_modal.dart';
import '../../dashboard/providers/dashboard_providers.dart';
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

    if (!isBookmarked) {
      final isPro = await resolveUserIsPro(ref);
      if (!isPro && _bookmarkedIds.length >= 25) {
        if (!mounted) return;
        ProUpgradeModal.show(
          context,
          title: 'বুকমার্ক লিমিট শেষ 📌',
          message: 'ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন বুকমার্ক করা যাবে। আনলিমিটেড বুকমার্ক ও স্টাডি নোটের জন্য প্রো সাবস্ক্রিপশন নাও।',
          featurePill: 'বুকমার্ক লিমিট: ২৫/২৫',
          icon: LucideIcons.bookmark,
        );
        return;
      }
    }

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
    ref.watch(userProfileProvider);
    final solutionAsync = ref.watch(liveExamSolutionProvider(widget.examId));

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFFAFAFA),
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
          final detailsAsync = ref.watch(liveExamDetailsProvider(widget.examId));
          final exam = detailsAsync.value?.exam ?? widget.exam;

          // Strict Result Protection Guard: Never leak solutions until exam is ended and result published
          if (exam != null && !exam.isResultPublished) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.lock,
                        size: 30,
                        color: Color(0xFFD97706),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'ফলাফল ও সমাধান এখনও অপ্রকাশিত',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      exam.endTime.isAfter(DateTime.now())
                          ? 'পরীক্ষার গোপনীয়তা ও সমতা বজায় রাখতে লাইভ পরীক্ষার সময়সীমা (${exam.endTime.hour.toString().padLeft(2, '0')}:${exam.endTime.minute.toString().padLeft(2, '0')}) শেষ হওয়ার পর সম্পূর্ণ সমাধান ও ফলাফল উন্মুক্ত করা হবে।'
                          : 'কর্তৃপক্ষ কর্তৃক এই পরীক্ষার ফলাফল ও সমাধান সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে। প্রকাশিত হওয়ামাত্রই দেখতে পারবেন।',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'HindSiliguri',
                        fontSize: 13.5,
                        height: 1.5,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF004633),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      onPressed: () => context.pop(),
                      icon: const Icon(LucideIcons.arrowLeft, size: 16),
                      label: const Text(
                        'ফিরে যান',
                        style: TextStyle(
                          fontFamily: 'HindSiliguri',
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          final questions = data.questions;
          final userAnswers = data.userAnswers;

          int correctCount = 0;
          int wrongCount = 0;
          int skippedCount = 0;
          num score = 0;
          final negativeRate = exam?.negativeMarking.toDouble() ?? widget.exam?.negativeMarking.toDouble() ?? 0.25;

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

          final finalScore = (score * 10000).round() / 10000.0;

          final filteredQuestions = questions.where((q) {
            final pick = userAnswers[q.id];
            if (_activeFilter == 'correct') return pick != null && pick == q.correctAnswerIndex;
            if (_activeFilter == 'wrong') return pick != null && pick != q.correctAnswerIndex;
            if (_activeFilter == 'skipped') return pick == null;
            return true;
          }).toList();

          return CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            cacheExtent: 600,
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 0),
                sliver: SliverToBoxAdapter(
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
                        physics: const BouncingScrollPhysics(),
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
                    ],
                  ),
                ),
              ),

              // Question Review Cards
              if (filteredQuestions.isEmpty)
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(32),
                    child: Center(
                      child: Text(
                        'কোনো প্রশ্ন পাওয়া যায়নি',
                        style: TextStyle(
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(10, 0, 10, 30),
                  sliver: SliverList.builder(
                    itemCount: filteredQuestions.length,
                    itemBuilder: (context, idx) {
                      final q = filteredQuestions[idx];
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
                    },
                  ),
                ),
            ],
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
