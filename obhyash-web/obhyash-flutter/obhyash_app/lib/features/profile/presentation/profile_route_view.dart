import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../dashboard/domain/models.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../../core/providers/auth_provider.dart';
import '../../notifications/presentation/notifications_view.dart';
import 'my_profile_view.dart';
import 'settings_view.dart';
import 'widgets/streak_calendar.dart';

// Provider that fetches exam history for current user
final _profileExamHistoryProvider = FutureProvider<List<ExamResult>>((
  ref,
) async {
  // Watch authProvider so this re-runs whenever auth state changes
  final user = ref.watch(authProvider);
  if (user == null) return [];
  final uid = user.id;
  final data = await Supabase.instance.client
      .from('exam_results')
      .select(
        'id, subject, subject_label, correct_count, wrong_count, total_questions, created_at',
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
          ? DateTime.tryParse(m['created_at'] as String)
          : null,
    );
  }).toList();
});

List<SubjectStats> _computeSubjectStats(List<ExamResult> history) {
  final map = <String, _SubjectAccum>{};
  for (final e in history) {
    final acc = map.putIfAbsent(
      e.subject,
      () => _SubjectAccum(label: e.subjectLabel ?? e.subject),
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
  final daysInMonth = DateTime(now.year, now.month + 1, 0).day;

  // Count exams per day of current month
  final examCounts = <int, int>{};
  for (final e in history) {
    if (e.createdAt != null &&
        e.createdAt!.year == now.year &&
        e.createdAt!.month == now.month) {
      examCounts[e.createdAt!.day] = (examCounts[e.createdAt!.day] ?? 0) + 1;
    }
  }

  return List.generate(daysInMonth, (i) {
    final d = i + 1;
    return MonthCalendarDay(
      date: DateTime(now.year, now.month, d),
      dayOfMonth: d,
      examCount: examCounts[d] ?? 0,
      isCurrentMonth: true,
    );
  });
}

class ProfileRouteView extends ConsumerWidget {
  const ProfileRouteView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfileAsync = ref.watch(userProfileProvider);
    final historyAsync = ref.watch(_profileExamHistoryProvider);

    return userProfileAsync.when(
      data: (user) {
        if (user == null) {
          return const Center(child: Text('User not found.'));
        }

        final history = historyAsync.value ?? [];
        final subjectStats = _computeSubjectStats(history);
        final calendarData = _buildCalendarData(history);

        return MyProfileView(
          user: user,
          history: history,
          subjectStats: subjectStats,
          calendarData: calendarData,
          onEditProfile: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => SettingsView(user: user)),
            );
          },
          onViewNotifications: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const NotificationsView(),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}
