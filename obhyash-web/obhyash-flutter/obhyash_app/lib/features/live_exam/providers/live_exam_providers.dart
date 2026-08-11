import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/models.dart';

// Provides the active filter (All, Ongoing, Upcoming)
class LiveExamFilterNotifier extends Notifier<String> {
  @override
  String build() => 'All';

  void updateFilter(String newFilter) {
    state = newFilter;
  }
}

final liveExamFilterProvider = NotifierProvider<LiveExamFilterNotifier, String>(
  () => LiveExamFilterNotifier(),
);

// Provides the search query
class LiveExamSearchNotifier extends Notifier<String> {
  @override
  String build() => '';

  void updateSearch(String newSearch) {
    state = newSearch;
  }
}

final liveExamSearchProvider = NotifierProvider<LiveExamSearchNotifier, String>(
  () => LiveExamSearchNotifier(),
);

// The category being viewed (e.g., BCS, Bank, Primary)
class LiveExamCategoryNotifier extends Notifier<String> {
  @override
  String build() => '';

  void updateCategory(String newCategory) {
    state = newCategory;
  }
}

final liveExamCategoryProvider =
    NotifierProvider<LiveExamCategoryNotifier, String>(
      () => LiveExamCategoryNotifier(),
    );

// Fetches the live exams from Supabase based on the category
final liveExamsProvider = FutureProvider.autoDispose<List<LiveExam>>((
  ref,
) async {
  final category = ref.watch(liveExamCategoryProvider);
  if (category.isEmpty) return [];

  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;

  // 1. Fetch all published exams for this category
  final examsResponse = await supabase
      .from('live_exams')
      .select()
      .eq('category', category)
      .eq('status', 'published')
      .order('start_time', ascending: false);

  final List<LiveExam> exams = (examsResponse as List)
      .map((e) => LiveExam.fromJson(e as Map<String, dynamic>))
      .toList();

  // 2. Fetch attempts for the current user if logged in
  if (user != null && exams.isNotEmpty) {
    final examIds = exams.map((e) => e.id).toList();
    final attemptsResponse = await supabase
        .from('live_exam_attempts')
        .select('exam_id, status')
        .eq('user_id', user.id)
        .inFilter('exam_id', examIds);

    final attempts = (attemptsResponse as List).cast<Map<String, dynamic>>();

    // Map status back to the exams
    for (int i = 0; i < exams.length; i++) {
      final attempt = attempts
          .where((a) => a['exam_id'] == exams[i].id)
          .firstOrNull;
      if (attempt != null) {
        // Recreate the model with userAttemptStatus
        exams[i] = LiveExam(
          id: exams[i].id,
          title: exams[i].title,
          description: exams[i].description,
          startTime: exams[i].startTime,
          endTime: exams[i].endTime,
          durationMinutes: exams[i].durationMinutes,
          totalQuestions: exams[i].totalQuestions,
          totalMarks: exams[i].totalMarks,
          negativeMarking: exams[i].negativeMarking,
          status: exams[i].status,
          category: exams[i].category,
          userAttemptStatus: attempt['status'] as String?,
        );
      }
    }
  }

  // Adding mock exams for visual testing just like the web app did,
  // this can be removed in production.
  final now = DateTime.now();
  exams.addAll([
    LiveExam(
      id: 'mock-untaken-$category',
      category: category,
      title: '[Mock] $category - Untaken',
      description: 'This is a mock untaken exam for testing.',
      startTime: now.subtract(const Duration(days: 1)),
      endTime: now.add(const Duration(days: 7)),
      durationMinutes: 45,
      totalQuestions: 50,
      totalMarks: 50,
      negativeMarking: 0.25,
      status: 'published',
      userAttemptStatus: null,
    ),
    LiveExam(
      id: 'mock-taken-$category',
      category: category,
      title: '[Mock] $category - Taken',
      description: 'This is a mock taken exam for testing.',
      startTime: now.subtract(const Duration(days: 2)),
      endTime: now.add(const Duration(days: 7)),
      durationMinutes: 60,
      totalQuestions: 100,
      totalMarks: 100,
      negativeMarking: 0.25,
      status: 'published',
      userAttemptStatus: 'submitted',
    ),
  ]);

  return exams;
});

// Provides the filtered list of exams based on search query and active filter
final filteredLiveExamsProvider = Provider.autoDispose<List<LiveExam>>((ref) {
  final examsAsync = ref.watch(liveExamsProvider);
  final filter = ref.watch(liveExamFilterProvider);
  final search = ref.watch(liveExamSearchProvider).toLowerCase();

  return examsAsync.when(
    data: (exams) {
      return exams.where((exam) {
        // Apply search filter
        if (search.isNotEmpty && !exam.title.toLowerCase().contains(search)) {
          return false;
        }

        // Apply tab filter
        if (filter == 'Ongoing' && !exam.isOngoing) return false;
        if (filter == 'Upcoming' && !exam.isUpcoming) return false;

        return true;
      }).toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});
