import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/presentation/widgets/app_icon.dart';
import 'package:obhyash_app/core/providers/theme_provider.dart';
import 'package:obhyash_app/core/utils/bangla_name_helper.dart';
import '../../exam/domain/exam_models.dart';
import '../../exam/presentation/widgets/question_card.dart';
import '../../exam/presentation/widgets/question_report_dialog.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'institute_question_bank_detail_view.dart';

class QuestionViewerView extends ConsumerStatefulWidget {
  final Map<String, dynamic> institute;
  final InstituteExamSet examSet;
  final List<Question> questions;

  const QuestionViewerView({
    super.key,
    required this.institute,
    required this.examSet,
    required this.questions,
  });

  @override
  ConsumerState<QuestionViewerView> createState() => _QuestionViewerViewState();
}

class _QuestionViewerViewState extends ConsumerState<QuestionViewerView> {
  // Map of questionId -> selectedOptionIndex
  final Map<String, int> _selectedAnswers = {};
  // Set of flagged and bookmarked questions
  final Set<String> _flaggedQuestions = {};
  final Set<String> _bookmarkedQuestions = {};

  int get _answeredCount => _selectedAnswers.length;

  @override
  void initState() {
    super.initState();
    _fetchBookmarks();
  }

  Future<void> _fetchBookmarks() async {
    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid == null) return;
    try {
      final res = await Supabase.instance.client
          .from('bookmarks')
          .select('question_id')
          .eq('user_id', uid);
      if (mounted) {
        setState(() {
          _bookmarkedQuestions.addAll(
            res
                .map((e) => e['question_id']?.toString() ?? '')
                .where((id) => id.isNotEmpty),
          );
        });
      }
    } catch (_) {}
  }

  void _toggleBookmark(String qId) {
    HapticFeedback.lightImpact();
    final wasBookmarked = _bookmarkedQuestions.contains(qId);
    setState(() {
      if (wasBookmarked) {
        _bookmarkedQuestions.remove(qId);
      } else {
        _bookmarkedQuestions.add(qId);
      }
    });

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          wasBookmarked
              ? 'বুকমার্ক থেকে সরানো হয়েছে'
              : 'বুকমার্কে সংরক্ষণ করা হয়েছে 📌',
          style: const TextStyle(fontFamily: 'HindSiliguri', fontSize: 13),
        ),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      ),
    );

    final uid = Supabase.instance.client.auth.currentUser?.id;
    if (uid != null) {
      final sb = Supabase.instance.client;
      if (wasBookmarked) {
        sb.from('bookmarks').delete().eq('user_id', uid).eq('question_id', qId).then((_) {}).catchError((_) {});
      } else {
        sb.from('bookmarks').insert({'user_id': uid, 'question_id': qId}).then((_) {}).catchError((_) {});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalCount = widget.questions.length;

    return Scaffold(
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
                  // LEFT: Back Button + Answered / Total Pill
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          context.pop();
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: AppIcon(
                            AppIcons.arrowLeft,
                            size: 18,
                            color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${BanglaNameHelper.toBanglaNumeral(_answeredCount)} / ${BanglaNameHelper.toBanglaNumeral(totalCount)}',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // MIDDLE: Title badge
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Text(
                        widget.examSet.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? const Color(0xFFF5F5F5) : const Color(0xFF27272A),
                        ),
                      ),
                    ),
                  ),

                  // RIGHT: Theme Toggle Button
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
                        size: 17,
                        color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),

      // BODY: Exact same structure and QuestionCards as ExamRunnerView
      body: widget.questions.isEmpty
          ? const Center(
              child: Text(
                'কোনো প্রশ্ন পাওয়া যায়নি।',
                style: TextStyle(fontFamily: 'HindSiliguri', fontSize: 16),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              itemCount: widget.questions.length,
              itemBuilder: (context, index) {
                final q = widget.questions[index];

                final distinctSubjects = widget.questions
                    .map((item) => BanglaNameHelper.getMainSubjectName(
                        item.subject, item.subject))
                    .toSet();
                final hasMultipleSubjects = distinctSubjects.length > 1;

                final currentSubjectName =
                    BanglaNameHelper.getMainSubjectName(q.subject, q.subject);

                final isFirstOfSubject = index == 0 ||
                    BanglaNameHelper.getMainSubjectName(
                            widget.questions[index - 1].subject,
                            widget.questions[index - 1].subject) !=
                        currentSubjectName;

                int subjectTotalCount = 0;
                if (isFirstOfSubject) {
                  subjectTotalCount = widget.questions
                      .where((item) =>
                          BanglaNameHelper.getMainSubjectName(
                            item.subject,
                            item.subject,
                          ) ==
                          currentSubjectName)
                      .length;
                }

                final subjectHeader = (hasMultipleSubjects && isFirstOfSubject)
                    ? Container(
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
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    currentSubjectName,
                                    style: TextStyle(
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.w800,
                                      fontFamily: 'HindSiliguri',
                                      color: isDark
                                          ? const Color(0xFFE4E4E7)
                                          : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '(${BanglaNameHelper.toBanglaNumeral(subjectTotalCount)}টি প্রশ্ন)',
                                    style: TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'HindSiliguri',
                                      color: isDark
                                          ? const Color(0xFFA1A1AA)
                                          : const Color(0xFF64748B),
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
                      )
                    : null;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ?subjectHeader,
                    QuestionCard(
                      question: q,
                      serialNumber: index + 1,
                      selectedOptionIndex: _selectedAnswers[q.id],
                      isFlagged: _flaggedQuestions.contains(q.id),
                      showFeedback: _selectedAnswers.containsKey(q.id) || q.options.isEmpty,
                      showAnswer: false,
                      hideSourceTag: true,
                      showReport: true,
                      initiallyExpanded: true,
                      onSelectOption: (optIndex) {
                        HapticFeedback.mediumImpact();
                        setState(() {
                          _selectedAnswers[q.id] = optIndex;
                        });
                      },
                      onToggleFlag: () {
                        HapticFeedback.lightImpact();
                        setState(() {
                          if (_flaggedQuestions.contains(q.id)) {
                            _flaggedQuestions.remove(q.id);
                          } else {
                            _flaggedQuestions.add(q.id);
                          }
                        });
                      },
                      onReport: () {
                        QuestionReportDialog.show(context, q.id);
                      },
                      isBookmarked: _bookmarkedQuestions.contains(q.id),
                      onToggleBookmark: () => _toggleBookmark(q.id),
                    ),
                  ],
                );
              },
            ),
    );
  }
}
