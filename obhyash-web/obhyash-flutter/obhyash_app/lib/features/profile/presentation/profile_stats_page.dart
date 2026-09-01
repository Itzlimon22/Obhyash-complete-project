import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../dashboard/domain/models.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/bangla_name_helper.dart';
import 'my_profile_view.dart';
import 'widgets/streak_calendar.dart';
import '../../../core/presentation/widgets/skeleton_loading.dart';

// Provider that fetches exam history for the stats page
final _statsExamHistoryProvider = FutureProvider.autoDispose<List<ExamResult>>((
  ref,
) async {
  final user = ref.watch(authProvider);
  if (user == null) return [];
  final uid = user.id;
  final data = await Supabase.instance.client
      .from('exam_results')
      .select(
        'id, subject, correct_count, wrong_count, total_questions, created_at, subject_label',
      )
      .eq('user_id', uid)
      .order('created_at', ascending: false)
      .limit(200);
  return (data as List).map((r) {
    final m = r as Map<String, dynamic>;
    return ExamResult(
      id: m['id'] as String? ?? '',
      subject: m['subject'] as String? ?? 'general',
      totalQuestions: (m['total_questions'] as num?)?.toInt() ?? 0,
      correctCount: (m['correct_count'] as num?)?.toInt() ?? 0,
      wrongCount: (m['wrong_count'] as num?)?.toInt() ?? 0,
      subjectLabel: m['subject_label'] as String?,
      createdAt: m['created_at'] != null
          ? DateTime.tryParse(m['created_at'] as String)?.toLocal()
          : null,
    );
  }).toList();
});

List<SubjectStats> _computeSubjectStats(List<ExamResult> history) {
  final map = <String, _SubjectAccum>{};
  for (final e in history) {
    final acc = map.putIfAbsent(
      e.subject,
      () => _SubjectAccum(label: BanglaNameHelper.formatSubject(e.subject, e.subjectLabel)),
    );
    acc.correct += e.correctCount;
    acc.wrong += e.wrongCount;
    acc.total += e.totalQuestions;
  }
  return map.entries.map((entry) {
    final acc = entry.value;
    final skipped = acc.total - acc.correct - acc.wrong;
    return SubjectStats(
      id: entry.key,
      name: acc.label,
      correct: acc.correct,
      wrong: acc.wrong,
      skipped: skipped < 0 ? 0 : skipped,
      total: acc.total,
    );
  }).toList();
}

class _SubjectAccum {
  String label;
  int correct = 0, wrong = 0, total = 0;
  _SubjectAccum({required this.label});
}

List<MonthCalendarDay> _buildCalendarData(List<ExamResult> history) {
  final now = DateTime.now();
  final examCounts = <String, int>{};

  for (final e in history) {
    if (e.createdAt != null) {
      final key = '${e.createdAt!.year}-${e.createdAt!.month}-${e.createdAt!.day}';
      examCounts[key] = (examCounts[key] ?? 0) + 1;
    }
  }

  final List<MonthCalendarDay> allDays = [];

  // Generate calendar days for only previous month (mOffset = 1) and current month (mOffset = 0)
  for (int mOffset = 1; mOffset >= 0; mOffset--) {
    final mDate = DateTime(now.year, now.month - mOffset, 1);
    final y = mDate.year;
    final m = mDate.month;
    final daysInMonth = DateTime(y, m + 1, 0).day;

    for (int d = 1; d <= daysInMonth; d++) {
      final key = '$y-$m-$d';
      allDays.add(
        MonthCalendarDay(
          date: DateTime(y, m, d),
          dayOfMonth: d,
          examCount: examCounts[key] ?? 0,
          isCurrentMonth: true,
        ),
      );
    }
  }

  return allDays;
}

class ProfileStatsPage extends ConsumerWidget {
  const ProfileStatsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProfileProvider);
    final historyAsync = ref.watch(_statsExamHistoryProvider);

    return userAsync.when(
      data: (user) {
        if (user == null) {
          return const Center(child: Text('User not found.'));
        }
        final history = historyAsync.value ?? [];
        return MyProfileView(
          user: user,
          history: history,
          subjectStats: _computeSubjectStats(history),
          calendarData: _buildCalendarData(history),
        );
      },
      loading: () => const ProfileStatsSkeleton(),
      error: (e, s) => Center(child: Text('Error: $e')),
    );
  }
}
